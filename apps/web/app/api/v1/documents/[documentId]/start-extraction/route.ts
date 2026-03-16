import { NextResponse, type NextRequest } from "next/server";

import { createOrReuseExtractionRun } from "@/lib/data";
import { toErrorResponse } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertApiAccess, resolveOwnerKey, withOwnerCookie } from "@/lib/request-context";

export async function POST(request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    assertApiAccess(request);
    const ownerKey = resolveOwnerKey(request);
    await assertRateLimit(ownerKey, "documents:start-extraction");

    const { documentId } = await params;
    const run = await createOrReuseExtractionRun(documentId, ownerKey);

    const response = NextResponse.json({
      run,
    });

    return withOwnerCookie(request, response, ownerKey);
  } catch (error) {
    return toErrorResponse(error);
  }
}
