import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import { segmentText, generateUploadId } from "@/lib/segmenter";
import { classifyChunks, JsonObject } from "@/lib/classifier";
import { EntryType, Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromPDF(buffer);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from PDF" },
        { status: 400 }
      );
    }

    // Segment text into chunks
    const chunks = segmentText(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No valid text chunks found in document" },
        { status: 400 }
      );
    }

    // Generate upload ID
    const uploadId = generateUploadId();
    const docName = file.name;

    // Classify chunks with AI
    const processedEntries = await classifyChunks(chunks, 25);

    // Filter out templates and save to database
    const entriesToSave = processedEntries.filter((e) => !e.isTemplate);

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

    // Helper to convert data to Prisma JSON type
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

    // Count by type
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
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
