import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const pdfMimeType = "application/pdf";
const docxMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export class ResumeTextExtractionError extends Error {
  readonly code = "TEXT_EXTRACTION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ResumeTextExtractionError";
  }
}

async function extractPdfText(bytes: Uint8Array) {
  const parser = new PDFParse({ data: bytes });
  const parsed = await parser.getText();
  await parser.destroy();
  return parsed.text ?? "";
}

async function extractDocxText(bytes: Uint8Array) {
  const parsed = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return parsed.value ?? "";
}

export async function extractResumeText(mimeType: string, bytes: Uint8Array) {
  let text = "";

  if (mimeType === pdfMimeType) {
    text = await extractPdfText(bytes);
  } else if (mimeType === docxMimeType) {
    text = await extractDocxText(bytes);
  } else {
    throw new ResumeTextExtractionError("Only PDF and DOCX resumes can be parsed right now.");
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length < 40) {
    throw new ResumeTextExtractionError("We could not read enough text from this resume. Try a clearer PDF or DOCX file.");
  }

  return normalized;
}
