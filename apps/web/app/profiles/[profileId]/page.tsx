import { getProfileById } from "@/lib/data";
import { buildProfileWorkspaceModel } from "@/lib/profile-ui";
import { resolveServerOwnerKey } from "@/lib/request-context";

import { DeleteProfileButton } from "../../components/delete-profile-button";
import { ProfileWorkspace } from "../../components/profile-workspace";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ profileId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profileId } = await params;
  const nextSearchParams = searchParams ? await searchParams : {};
  const tab = typeof nextSearchParams.tab === "string" ? nextSearchParams.tab : "overview";
  const starterPrompt =
    typeof nextSearchParams.starterPrompt === "string" ? nextSearchParams.starterPrompt : undefined;
  const ownerKey = await resolveServerOwnerKey();
  const profile = await getProfileById(profileId, ownerKey);
  const model = buildProfileWorkspaceModel({
    fullName: profile.full_name,
    headline: profile.headline,
    location: profile.location,
    canonicalJson: profile.canonical_json,
  });

  return (
    <ProfileWorkspace
      defaultTab={tab}
      model={model}
      profileId={profileId}
      starterPrompt={starterPrompt}
      trailingActions={
        <DeleteProfileButton
          profileId={profileId}
          profileName={profile.full_name}
          redirectTo="/"
          className="whitespace-nowrap border-[#e5b8b8] bg-[#fff4f4] text-[#9f2f2f] hover:bg-[#ffe9e9] lg:min-h-11 lg:px-4 lg:py-2.5"
        />
      }
    />
  );
}
