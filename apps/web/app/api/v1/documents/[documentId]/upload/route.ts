import { NextRequest } from "next/server";

import { uploadDocumentBytes } from "@/lib/data";
import { AppError, toErrorResponse } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertApiAccess, resolveOwnerKey } from "@/lib/request-context";
import { env } from "@/lib/env";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    assertApiAccess(request);
    const ownerKey = resolveOwnerKey(request);
    await assertRateLimit(ownerKey, "documents:upload");

    const mimeType = request.headers.get("content-type") ?? "application/pdf";
    const bytes = new Uint8Array(await request.arrayBuffer());

    if (bytes.byteLength > env.maxUploadBytes) {
      throw new AppError(400, "file_too_large", "Uploaded files must stay within the configured size limit.");
    }

    const { documentId } = await params;
    const document = await uploadDocumentBytes(documentId, bytes, mimeType);

    return Response.json({
      document,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

