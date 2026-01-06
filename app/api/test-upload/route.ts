import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { segmentText, generateUploadId } from "@/lib/segmenter";
import { classifyChunks, JsonObject } from "@/lib/classifier";
import { EntryType, Prisma } from "@prisma/client";

// Sample commonplace text for testing without uploading a PDF
const SAMPLE_TEXT = `
# Example Commonplace Notes

This document is an example set of notes designed to test the Instant Study Buddy app. It contains vocabulary, phrases, quotes, and thought frameworks.

# Vocabulary

Profundity — noun — deep insight, intellectual depth, or great intensity of thought, knowledge, or emotion. Example: The philosopher's writings were filled with profundity.

Cogent — adjective — clear, logical, and convincing; appealing effectively to reason. Example: She presented a cogent argument that persuaded even her strongest critics.

Ubiquitous — adjective — present, appearing, or found everywhere at the same time. Example: Smartphones have become ubiquitous in modern life.

Motif — noun — a recurring element, theme, or idea in a work of art, literature, or music that has symbolic significance.

Exhume — verb — to dig out or remove something buried, especially a body from the ground; more broadly, to bring something forgotten or hidden back to light.

# Phrases & Expressions

Second-order thinking — considering not just the immediate effects of an action, but the subsequent consequences.

Skin in the game — having personal risk or investment in an outcome.

Zoom out — to take a broader, long-term perspective on a problem.

# Quotes

"The unexamined life is not worth living." — Socrates

"What we think, we become." — Buddha

"All models are wrong, but some are useful." — George Box

# Thought Frameworks

Inversion — Instead of asking how to succeed, ask how you might fail and then avoid those behaviors.

Opportunity cost — Every choice excludes alternatives; evaluate decisions based on what you are giving up.

First principles thinking — Break a problem down to its most basic truths and reason up from there.
`;

export async function POST(request: NextRequest) {
  try {
    const { userId: authUserId } = await auth();

    // In development, allow test requests without auth using a test user ID
    const userId =
      authUserId ||
      (process.env.NODE_ENV === "development" ? "test_user_dev" : null);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Option to skip AI classification for faster testing
    const { searchParams } = new URL(request.url);
    const skipAI = searchParams.get("skipAI") === "true";

    // Segment text into chunks
    const chunks = segmentText(SAMPLE_TEXT);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No valid text chunks found" },
        { status: 400 }
      );
    }

    const uploadId = generateUploadId();
    const docName = "test-sample.pdf";

    let entriesToSave;

    if (skipAI) {
      // Create mock entries without AI classification for fast testing
      entriesToSave = chunks.map((chunk, i) => ({
        chunkClean: chunk.clean,
        chunkRaw: chunk.raw,
        type: "unknown" as const,
        title: `Test Entry ${i + 1}`,
        content: chunk.clean,
        tags: [] as string[],
        vocabData: null,
        quoteData: null,
        phraseData: null,
        confidence: 0,
        isTemplate: false,
        parseError: false,
      }));
    } else {
      // Full AI classification
      const processedEntries = await classifyChunks(chunks, 25);
      entriesToSave = processedEntries.filter((e) => !e.isTemplate);
    }

    const validEntryTypes = [
      "vocab",
      "quote",
      "phrase",
      "thought_wrapper",
      "prompt",
      "reflection",
      "template",
      "unknown",
    ];

    const toJsonOrNull = (
      data: JsonObject | null
    ): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
      return data ? (data as Prisma.InputJsonValue) : Prisma.JsonNull;
    };

    const savedEntries = await prisma.entry.createMany({
      data: entriesToSave.map((entry) => ({
        userId,
        uploadId,
        docName,
        chunkClean: entry.chunkClean,
        chunkRaw: entry.chunkRaw,
        type: (validEntryTypes.includes(entry.type)
          ? entry.type
          : "unknown") as EntryType,
        title: entry.title,
        content: entry.content,
        tags: entry.tags,
        vocabData: toJsonOrNull(entry.vocabData),
        quoteData: toJsonOrNull(entry.quoteData),
        phraseData: toJsonOrNull(entry.phraseData),
        confidence: entry.confidence,
        isTemplate: entry.isTemplate,
        parseError: entry.parseError,
      })),
    });

    const byType: Record<string, number> = {};
    for (const entry of entriesToSave) {
      const type = entry.type || "unknown";
      byType[type] = (byType[type] || 0) + 1;
    }

    return NextResponse.json({
      message: skipAI
        ? "Test entries created (AI skipped)"
        : "Test entries created with AI classification",
      totalChunks: chunks.length,
      processedEntries: savedEntries.count,
      byType,
    });
  } catch (error) {
    console.error("Test upload error:", error);
    return NextResponse.json(
      { error: "Failed to process test data", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/test-upload to create test entries",
    options: {
      "?skipAI=true": "Skip AI classification for faster testing",
    },
    sampleChunks: segmentText(SAMPLE_TEXT).length,
  });
}
