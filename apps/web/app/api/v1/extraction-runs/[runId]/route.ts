import { NextResponse, type NextRequest } from "next/server";

import { getExtractionRunStatus } from "@/lib/data";
import { toErrorResponse } from "@/lib/errors";
import { assertApiAccess, resolveOwnerKey, withOwnerCookie } from "@/lib/request-context";

export async function GET(request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    assertApiAccess(request);
    const ownerKey = resolveOwnerKey(request);
    const { runId } = await params;
    const payload = await getExtractionRunStatus(runId, ownerKey);

    const response = NextResponse.json(payload);
    return withOwnerCookie(request, response, ownerKey);
  } catch (error) {
    return toErrorResponse(error);
  }
}
