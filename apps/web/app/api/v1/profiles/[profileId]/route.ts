import { NextResponse, type NextRequest } from "next/server";

import { deleteProfileById, getProfileById } from "@/lib/data";
import { toErrorResponse } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertApiAccess, resolveOwnerKey, withOwnerCookie } from "@/lib/request-context";

export async function GET(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    assertApiAccess(request);
    const ownerKey = resolveOwnerKey(request);
    const { profileId } = await params;
    const profile = await getProfileById(profileId, ownerKey);

    const response = NextResponse.json({
      id: profile.id,
      fullName: profile.full_name,
      headline: profile.headline,
      location: profile.location,
      schemaVersion: profile.schema_version,
      sections: profile.sections,
      canonicalJson: profile.canonical_json,
    });

    return withOwnerCookie(request, response, ownerKey);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    assertApiAccess(request);
    const ownerKey = resolveOwnerKey(request);
    await assertRateLimit(ownerKey, "profiles:delete");

    const { profileId } = await params;
    const result = await deleteProfileById(profileId, ownerKey);

    const response = NextResponse.json({
      deleted: {
        profileId: result.profileId,
        documentId: result.documentId,
      },
      warning: result.storageCleanupError
        ? {
            code: "storage_cleanup_failed",
            message: result.storageCleanupError,
          }
        : null,
    });

    return withOwnerCookie(request, response, ownerKey);
  } catch (error) {
    return toErrorResponse(error);
  }
}
