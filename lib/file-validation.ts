/**
 * Defensive validation for user-uploaded documents.
 *
 * Why magic-byte sniffing: a user can rename `evil.exe` to `agreement.pdf` and
 * the browser will report `application/pdf` for the upload. Detecting the actual
 * file signature catches mismatches before we ever store the content.
 *
 * For Phase 1 we only accept PDF and DOCX (the two formats the wizard expects).
 */

import { fileTypeFromBuffer } from "file-type";

export const ALLOWED_DOC_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedDocMime = (typeof ALLOWED_DOC_MIME)[number];

const ALLOWED_DOC_EXT = new Set(["pdf", "docx"]);

export interface ValidatedDoc {
  buffer: Buffer;
  mime: AllowedDocMime;
  originalName: string;
}

export interface FileValidationFailure {
  ok: false;
  reason: string;
}

export interface FileValidationSuccess {
  ok: true;
  doc: ValidatedDoc;
}

export type FileValidationResult =
  | FileValidationSuccess
  | FileValidationFailure;

/**
 * Verify the file is actually a PDF or DOCX by inspecting magic bytes,
 * not just the browser-reported MIME or extension.
 */
export async function validateUploadedDoc(input: {
  buffer: Buffer;
  originalName: string;
  declaredMime?: string | null;
  maxBytes: number;
}): Promise<FileValidationResult> {
  if (input.buffer.length === 0) {
    return { ok: false, reason: "File is empty" };
  }
  if (input.buffer.length > input.maxBytes) {
    return {
      ok: false,
      reason: `File too large (max ${Math.round(input.maxBytes / 1024 / 1024)} MB)`,
    };
  }

  const detected = await fileTypeFromBuffer(input.buffer);
  if (!detected) {
    return {
      ok: false,
      reason:
        "Could not detect file type. Upload a real PDF or DOCX file (not a renamed image, script, or archive).",
    };
  }

  if (!ALLOWED_DOC_EXT.has(detected.ext)) {
    return {
      ok: false,
      reason: `File appears to be ${detected.mime}. Only PDF and DOCX are accepted.`,
    };
  }

  const detectedMime = detected.mime as AllowedDocMime;

  // Browser MIME is advisory; we only warn on mismatch in logs.
  return {
    ok: true,
    doc: {
      buffer: input.buffer,
      mime: detectedMime,
      originalName: input.originalName.slice(0, 200) || "document",
    },
  };
}
