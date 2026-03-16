import { describe, expect, it } from "vitest";

import { buildStoragePath, sanitizeFilename } from "../lib/storage";

describe("storage helpers", () => {
  it("sanitizes uploaded filenames", () => {
    expect(sanitizeFilename("Jane Doe Profile (Final).PDF")).toBe("jane-doe-profile-final-.pdf");
  });

  it("creates a document-specific storage path", () => {
    const result = buildStoragePath("Profile.pdf");
    expect(result.documentId).toBeTypeOf("string");
    expect(result.storagePath).toContain(result.documentId);
    expect(result.storagePath.endsWith("/profile.pdf")).toBe(true);
  });
});

