import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import { segmentText, generateUploadId } from "@/lib/segmenter";
import { classifyChunks, JsonObject } from "@/lib/classifier";
import { EntryType, Prisma } from "@prisma/client";

// Allow up to 60 seconds for PDF processing + AI classification
// Requires Vercel Pro plan for >10s, otherwise capped at 10s on Hobby
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
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

    // Helper to convert data to Prisma JSON type
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process document", details: message },
      { status: 500 }
    );
  }
}
