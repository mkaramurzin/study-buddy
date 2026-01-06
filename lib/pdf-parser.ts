import { extractText } from "unpdf";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // unpdf expects Uint8Array, not Buffer
  const uint8 = new Uint8Array(buffer);
  const { text } = await extractText(uint8);
  // unpdf returns an array of strings (one per page), join them
  return Array.isArray(text) ? text.join("\n") : text;
}
