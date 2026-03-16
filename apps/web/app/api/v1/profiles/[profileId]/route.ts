import { getProfileById } from "@/lib/data";
import { toErrorResponse } from "@/lib/errors";

export async function GET(_: Request, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const { profileId } = await params;
    const profile = await getProfileById(profileId);

    return Response.json({
      id: profile.id,
      fullName: profile.full_name,
      headline: profile.headline,
      location: profile.location,
      schemaVersion: profile.schema_version,
      sections: profile.sections,
      canonicalJson: profile.canonical_json,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

