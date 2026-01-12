import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
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
        userId: user.id,
        isTemplate: false,
      },
      select: {
        type: true,
        title: true,
        content: true,
        tags: true,
        metadata: true,
      },
      take: 100, // Limit to recent 100 entries for context
      orderBy: { createdAt: "desc" },
    });

    // Format entries for the AI - generic metadata handling
    const formattedEntries = entries.map((entry) => {
      const parts: string[] = [`Type: ${entry.type}`];
      
      if (entry.title) parts.push(`Title: ${entry.title}`);
      
      // Format metadata fields generically
      if (entry.metadata && typeof entry.metadata === "object") {
        const meta = entry.metadata as Record<string, unknown>;
        for (const [key, value] of Object.entries(meta)) {
          if (value && value !== "") {
            if (Array.isArray(value) && value.length > 0) {
              parts.push(`${key}: ${value.join(", ")}`);
            } else if (typeof value === "string" && value.trim()) {
              parts.push(`${key}: ${value}`);
            }
          }
        }
      }
      
      if (entry.content) {
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
User's Knowledge Base Summary:
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
