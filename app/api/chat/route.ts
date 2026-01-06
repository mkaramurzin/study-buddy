import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { PRACTICE_AGENT_SYSTEM_PROMPT } from "@/lib/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = (await request.json()) as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages required" },
        { status: 400 }
      );
    }

    // Fetch user's entries to provide context
    const entries = await prisma.entry.findMany({
      where: {
        userId,
        isTemplate: false,
      },
      select: {
        type: true,
        title: true,
        content: true,
        tags: true,
        vocabData: true,
        quoteData: true,
        phraseData: true,
      },
      take: 100, // Limit to recent 100 entries for context
      orderBy: { createdAt: "desc" },
    });

    // Format entries for the AI
    const formattedEntries = entries.map((entry) => {
      const parts: string[] = [`Type: ${entry.type}`];
      
      if (entry.title) parts.push(`Title: ${entry.title}`);
      
      if (entry.type === "vocab" && entry.vocabData) {
        const vocab = entry.vocabData as Record<string, unknown>;
        if (vocab.term) parts.push(`Term: ${vocab.term}`);
        if (vocab.definition) parts.push(`Definition: ${vocab.definition}`);
        if (vocab.example_sentence) parts.push(`Example: ${vocab.example_sentence}`);
        if (vocab.synonyms && Array.isArray(vocab.synonyms)) {
          parts.push(`Synonyms: ${vocab.synonyms.join(", ")}`);
        }
      } else if (entry.type === "quote" && entry.quoteData) {
        const quote = entry.quoteData as Record<string, unknown>;
        if (quote.quote) parts.push(`Quote: "${quote.quote}"`);
        if (quote.author) parts.push(`Author: ${quote.author}`);
      } else if (entry.type === "phrase" && entry.phraseData) {
        const phrase = entry.phraseData as Record<string, unknown>;
        if (phrase.phrase) parts.push(`Phrase: ${phrase.phrase}`);
        if (phrase.phrase_type) parts.push(`Type: ${phrase.phrase_type}`);
        if (phrase.why_it_stood_out) parts.push(`Note: ${phrase.why_it_stood_out}`);
      } else if (entry.content) {
        parts.push(`Content: ${entry.content}`);
      }
      
      return parts.join("\n");
    });

    // Build context about the user's collection
    const entryCountByType: Record<string, number> = {};
    entries.forEach((e) => {
      entryCountByType[e.type] = (entryCountByType[e.type] || 0) + 1;
    });

    const contextSummary = `
User's Commonplace Database Summary:
- Total entries available: ${entries.length}
- Breakdown: ${Object.entries(entryCountByType)
      .map(([type, count]) => `${type}: ${count}`)
      .join(", ")}

===== USER'S ENTRIES =====
${formattedEntries.join("\n\n---\n\n")}
===== END OF ENTRIES =====
`;

    const systemMessage = `${PRACTICE_AGENT_SYSTEM_PROMPT}

${contextSummary}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0]?.message?.content || "";

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
