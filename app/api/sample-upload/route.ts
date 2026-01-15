import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { segmentText, generateUploadId } from "@/lib/segmenter";
import { classifyChunks, JsonObject } from "@/lib/classifier";
import { SAMPLE_MATERIAL } from "@/lib/sample-material";
import { EntryType, Prisma } from "@prisma/client";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chunks = segmentText(SAMPLE_MATERIAL);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No valid text chunks found in sample material" },
        { status: 400 }
      );
    }

    const uploadId = generateUploadId();
    const docName = "Sample: Articulate Verbiage";

    const processedEntries = await classifyChunks(chunks, 25);
    const entriesToSave = processedEntries.filter((e) => !e.isTemplate);

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
        userId: user.id,
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
      totalChunks: chunks.length,
      processedEntries: savedEntries.count,
      byType,
    });
  } catch (error) {
    console.error("Sample upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process sample material", details: message },
      { status: 500 }
    );
  }
}
