import { getProfileById } from "@/lib/data";
import { toErrorResponse } from "@/lib/errors";

export async function GET(_: Request, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const { profileId } = await params;
    const profile = await getProfileById(profileId);

    return new Response(JSON.stringify(profile.canonical_json, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename="${profile.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

