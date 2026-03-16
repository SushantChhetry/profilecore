import { randomUUID } from "node:crypto";

import { env } from "./env";

export function sanitizeFilename(filename: string): string {
  return filename.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-").replace(/-{2,}/g, "-");
}

export function buildStoragePath(filename: string): { documentId: string; storagePath: string } {
  const documentId = randomUUID();
  const safeName = sanitizeFilename(filename);
  return {
    documentId,
    storagePath: `documents/${documentId}/${safeName || "profile.pdf"}`,
  };
}

export function ensurePdfFile(mimeType: string, byteSize: number): void {
  if (mimeType !== "application/pdf") {
    throw new Error("Only PDF uploads are supported.");
  }

  if (byteSize < 1) {
    throw new Error("Uploaded files cannot be empty.");
  }

  if (byteSize > env.maxUploadBytes) {
    throw new Error(`Uploaded files must be smaller than ${Math.round(env.maxUploadBytes / 1024 / 1024)} MB.`);
  }
}

