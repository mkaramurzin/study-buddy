import OpenAI from "openai";
import { CLASSIFIER_SYSTEM_PROMPT, CLASSIFIER_USER_PROMPT } from "./prompts";
import type { TextChunk } from "./segmenter";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use generic JSON-compatible types for Prisma compatibility
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

export interface ClassifiedEntry {
  type: string;
  title: string;
  content: string;
  tags: string[];
  metadata: JsonObject;
  meta: {
    confidence: number;
    detected_sections: string[];
    is_template: boolean;
  };
}

export interface ProcessedEntry {
  chunkClean: string;
  chunkRaw: string;
  type: string;
  title: string | null;
  content: string | null;
  tags: string[];
  metadata: JsonObject | null;
  confidence: number;
  isTemplate: boolean;
  parseError: boolean;
}

function stripFences(s: string): string {
  let t = (s || "").trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\s*/m, "");
    t = t.replace(/```$/m, "");
    t = t.trim();
  }
  return t;
}

function tryParseJSON(s: string): { ok: boolean; val: ClassifiedEntry | null } {
  const t = stripFences(s);

  try {
    return { ok: true, val: JSON.parse(t) };
  } catch {
    // Fallback: extract first JSON object
    const m = t.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return { ok: true, val: JSON.parse(m[0]) };
      } catch {
        // Intentionally empty
      }
    }
  }

  return { ok: false, val: null };
}

export async function classifyChunk(chunk: TextChunk): Promise<ProcessedEntry> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
        { role: "user", content: CLASSIFIER_USER_PROMPT(chunk.clean) },
      ],
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content || "";
    const parsed = tryParseJSON(raw);

    if (!parsed.ok || !parsed.val) {
      return {
        chunkClean: chunk.clean,
        chunkRaw: chunk.raw,
        type: "unknown",
        title: null,
        content: null,
        tags: [],
        metadata: null,
        confidence: 0,
        isTemplate: false,
        parseError: true,
      };
    }

    const entry = parsed.val;

    // Check if metadata has meaningful content (at least one non-empty value)
    const hasMetadata =
      entry.metadata &&
      typeof entry.metadata === "object" &&
      Object.values(entry.metadata).some(
        (v) =>
          (typeof v === "string" && v.trim() !== "") ||
          (Array.isArray(v) && v.length > 0)
      );

    return {
      chunkClean: chunk.clean,
      chunkRaw: chunk.raw,
      type: entry.type || "unknown",
      title: entry.title || null,
      content: entry.content || null,
      tags: entry.tags || [],
      metadata: hasMetadata ? entry.metadata : null,
      confidence: entry.meta?.confidence ?? 0,
      isTemplate: entry.meta?.is_template ?? false,
      parseError: false,
    };
  } catch (error) {
    console.error("Classification error:", error);
    return {
      chunkClean: chunk.clean,
      chunkRaw: chunk.raw,
      type: "unknown",
      title: null,
      content: null,
      tags: [],
      metadata: null,
      confidence: 0,
      isTemplate: false,
      parseError: true,
    };
  }
}

export async function classifyChunks(
  chunks: TextChunk[],
  batchSize: number = 25
): Promise<ProcessedEntry[]> {
  const results: ProcessedEntry[] = [];

  // Process in batches
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(classifyChunk));
    results.push(...batchResults);
  }

  return results;
}
