import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { segmentText, generateUploadId } from "@/lib/segmenter";
import { classifyChunks, JsonObject } from "@/lib/classifier";
import { EntryType, Prisma } from "@prisma/client";

// Sample text for testing without uploading a PDF
const SAMPLE_TEXT = `
# Example Knowledge Base Notes

This document tests the universal knowledge system with concepts, principles, quotes, examples, procedures, questions, connections, notes, and references.

# Concepts

Profundity — noun — deep insight, intellectual depth, or great intensity of thought. Field: Philosophy. Example: The philosopher's writings were filled with profundity.

Recursion — In computer science, a technique where a function calls itself to solve a problem by breaking it into smaller instances.

Entropy — A measure of disorder or randomness in a system. In thermodynamics, it always increases in an isolated system.

# Principles

Pareto Principle (80/20 Rule) — Roughly 80% of effects come from 20% of causes. Domain: Business, productivity. Conditions: Applies to unequal distributions.

DRY (Don't Repeat Yourself) — Every piece of knowledge must have a single, unambiguous representation. Domain: Software engineering.

Newton's First Law — An object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force.

# Quotes

"The unexamined life is not worth living." — Socrates, from The Apology

"All models are wrong, but some are useful." — George Box, statistician

"Premature optimization is the root of all evil." — Donald Knuth

# Examples

Binary Search Example — Given sorted array [1,3,5,7,9], to find 7: check middle (5), 7>5 so search right half, check 7, found! Demonstrates: logarithmic time complexity.

The Marshmallow Test — Children offered one marshmallow now or two if they wait. Those who waited had better life outcomes. Demonstrates: delayed gratification, self-control.

# Procedures

How to Debug Code — 1. Reproduce the bug consistently. 2. Isolate the problem area. 3. Form a hypothesis. 4. Test the hypothesis. 5. Fix and verify.

Scientific Method — 1. Observe. 2. Form hypothesis. 3. Design experiment. 4. Collect data. 5. Analyze. 6. Draw conclusions.

# Questions

Why do we procrastinate on important tasks but easily do trivial ones? Related: temporal discounting, present bias.

What would happen if interest rates went negative everywhere? Economic thought experiment.

# Connections

Compound interest is like evolution — both involve small changes accumulating over time to create dramatic results. Key insight: patience and time are the multipliers.

Code refactoring is like editing prose — both involve restructuring without changing the meaning/behavior.

# Notes

Noticed today that my best work happens in 90-minute focused blocks. Maybe related to ultradian rhythms?

Reading "Thinking Fast and Slow" - the two systems model explains so much about cognitive biases.

# References

"Thinking, Fast and Slow" by Daniel Kahneman — behavioral economics, cognitive biases. See chapters 1-4 for System 1 vs System 2.

https://en.wikipedia.org/wiki/Pareto_principle — Good overview of the 80/20 rule with historical context.
`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // In development, allow test requests without auth using a test user ID
    const userId =
      user?.id ||
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
        metadata: null,
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
      "concept",
      "principle",
      "quote",
      "example",
      "procedure",
      "question",
      "connection",
      "note",
      "reference",
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
        metadata: toJsonOrNull(entry.metadata),
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
