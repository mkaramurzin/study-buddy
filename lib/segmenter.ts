/**
 * Text segmentation logic ported from n8n "Normalize + Segment" node.
 * Splits extracted PDF text into candidate entries for classification.
 */

export interface TextChunk {
  raw: string;
  clean: string;
  charLen: number;
}

function normalize(s: string): string {
  return (s || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitBlocks(text: string): string[] {
  // Split on blank lines first
  let blocks = text
    .split(/\n\s*\n/g)
    .map((x) => x.trim())
    .filter(Boolean);

  // If we only got one big block, try splitting on common patterns
  if (blocks.length === 1 && blocks[0].length > 500) {
    // Split on lines that start with a capitalized word followed by em-dash (vocab pattern)
    // Or lines that start with quotes (quote pattern)
    // Or section headers like "Vocabulary", "Quotes", etc.
    const lines = blocks[0].split("\n");
    const newBlocks: string[] = [];
    let current = "";

    for (const line of lines) {
      const trimmed = line.trim();
      // Detect entry patterns: "Word — " or starts with quote or is a section header
      const isNewEntry =
        /^[A-Z][a-z]+\s*—/.test(trimmed) || // Vocab: "Profundity — noun"
        /^"[^"]+"\s*—/.test(trimmed) || // Quote: ""The unexamined..." — Socrates"
        /^(Vocabulary|Quotes|Phrases|Thought Frameworks|#\s)/.test(trimmed); // Headers

      if (isNewEntry && current.trim()) {
        newBlocks.push(current.trim());
        current = trimmed;
      } else {
        current = current ? `${current}\n${trimmed}` : trimmed;
      }
    }
    if (current.trim()) newBlocks.push(current.trim());

    if (newBlocks.length > 1) {
      blocks = newBlocks;
    }
  }

  // Further split big bullet-heavy blocks by bullet starts
  const out: string[] = [];
  for (const b of blocks) {
    const parts = b
      .split(/(?=^(?:[-*•]|\d+[.)])\s+)/gm)
      .map((x) => x.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      out.push(...parts);
    } else {
      out.push(b);
    }
  }
  return out;
}

function mergeSmall(blocks: string[], minChars: number = 120): string[] {
  const merged: string[] = [];
  let buf = "";

  const flush = () => {
    const f = buf.trim();
    if (f) merged.push(f);
    buf = "";
  };

  for (const b of blocks) {
    if (!buf) {
      buf = b;
      continue;
    }
    if (buf.length < minChars || b.length < minChars) {
      buf = `${buf}\n${b}`.trim();
    } else {
      flush();
      buf = b;
    }
  }
  flush();
  return merged;
}

export function generateUploadId(): string {
  return `upl_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export function segmentText(text: string): TextChunk[] {
  const cleaned = normalize(text);
  const blocks = mergeSmall(splitBlocks(cleaned), 120);

  // Section headers to skip (structural, not content)
  const headerPatterns = [
    /^#?\s*(vocabulary|quotes|phrases|thought frameworks|expressions)/i,
    /^example\s+notes/i,
    /^this document is an example/i,
  ];

  const results: TextChunk[] = [];
  for (const block of blocks) {
    const clean = normalize(block);
    // Skip chunks that are too short
    if (clean.length < 40) continue;

    // Skip section headers
    const isHeader = headerPatterns.some((p) => p.test(clean));
    if (isHeader) continue;

    results.push({
      raw: block,
      clean,
      charLen: clean.length,
    });
  }

  return results;
}
