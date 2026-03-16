import { NextResponse, type NextRequest } from "next/server";

import { getProfileById } from "@/lib/data";
import { toErrorResponse } from "@/lib/errors";
import { assertApiAccess, resolveOwnerKey, withOwnerCookie } from "@/lib/request-context";

export async function GET(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    assertApiAccess(request);
    const ownerKey = resolveOwnerKey(request);
    const { profileId } = await params;
    const profile = await getProfileById(profileId, ownerKey);

    const response = new NextResponse(JSON.stringify(profile.canonical_json, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename="${profile.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json"`,
      },
    });

    return withOwnerCookie(request, response, ownerKey);
  } catch (error) {
    return toErrorResponse(error);
  }
}
