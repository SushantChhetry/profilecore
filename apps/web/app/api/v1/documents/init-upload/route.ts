import { NextResponse, type NextRequest } from "next/server";

import { createUploadedDocument } from "@/lib/data";
import { AppError, toErrorResponse } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertApiAccess, resolveOwnerKey, withOwnerCookie } from "@/lib/request-context";
import { buildStoragePath, ensurePdfFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    assertApiAccess(request);

    const ownerKey = resolveOwnerKey(request);
    await assertRateLimit(ownerKey, "documents:init-upload");

    const body = (await request.json()) as {
      filename?: string;
      mimeType?: string;
      byteSize?: number;
    };

    if (!body.filename || !body.mimeType || typeof body.byteSize !== "number") {
      throw new AppError(400, "invalid_payload", "filename, mimeType, and byteSize are required.");
    }

    try {
      ensurePdfFile(body.mimeType, body.byteSize);
    } catch (validationError) {
      throw new AppError(400, "invalid_file", validationError instanceof Error ? validationError.message : "Invalid upload.");
    }

    const uploadTarget = buildStoragePath(body.filename);
    await createUploadedDocument({
      documentId: uploadTarget.documentId,
      ownerKey,
      filename: body.filename,
      mimeType: body.mimeType,
      byteSize: body.byteSize,
      storagePath: uploadTarget.storagePath,
    });

    const response = NextResponse.json({
      documentId: uploadTarget.documentId,
      storagePath: uploadTarget.storagePath,
      upload: {
        mode: "server_proxy",
        url: `/api/v1/documents/${uploadTarget.documentId}/upload`,
      },
    });

    return withOwnerCookie(request, response, ownerKey);
  } catch (error) {
    return toErrorResponse(error);
  }
}
