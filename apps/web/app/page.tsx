import Link from "next/link";

import { listProfileLibraryItems } from "@/lib/data";
import { resolveServerOwnerKey } from "@/lib/request-context";

import { DeleteProfileButton } from "./components/delete-profile-button";
import { HistoryBackButton } from "./components/history-back-button";
import { UploadForm } from "./components/upload-form";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ownerKey = await resolveServerOwnerKey();
  const nextSearchParams = searchParams ? await searchParams : {};
  const companyFilter = typeof nextSearchParams.company === "string" ? nextSearchParams.company.trim() : "";
  const profiles = await listProfileLibraryItems(ownerKey);
  const companyOptions = Array.from(
    new Set(profiles.map((profile) => profile.currentCompany).filter((company): company is string => Boolean(company?.trim()))),
  ).sort((left, right) => left.localeCompare(right));
  const visibleProfiles = companyFilter
    ? profiles.filter((profile) => profile.currentCompany?.toLowerCase() === companyFilter.toLowerCase())
    : profiles;

  return (
    <main className="mx-auto grid min-h-[calc(100vh-104px)] w-[min(1120px,calc(100%-32px))] gap-6 px-0 py-8 md:grid-cols-[280px_minmax(0,1fr)] md:items-start md:py-[32px]">
      <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
        <HistoryBackButton />
        <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
          Home / Profile library
        </span>
      </div>

      <aside className="grid content-between gap-7 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)] p-6 backdrop-blur-[18px] md:sticky md:top-8 md:min-h-[420px]">
        <div className="grid gap-4">
          <span className="inline-flex w-fit items-center rounded-full bg-[var(--accent-soft)] px-3 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
            ProfileCore
          </span>
          <div className="grid gap-4">
            <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.16em] text-[var(--muted)]">Step 1</p>
            <p className="max-w-[58ch] text-base leading-7 text-[var(--muted)]">
              Drop in a LinkedIn PDF once. The homepage keeps the parsed profiles so you can reopen and keep chatting later.
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          <Card className="flex items-center gap-3 bg-white/55 px-[14px] py-3 font-mono text-[0.82rem] uppercase tracking-[0.04em]">
            <span className="text-[var(--accent-strong)]">01</span>
            <span>Upload</span>
          </Card>
          <Card className="flex items-center gap-3 bg-white/55 px-[14px] py-3 font-mono text-[0.82rem] uppercase tracking-[0.04em] text-[var(--muted)]">
            <span className="text-[var(--accent-strong)]">02</span>
            <span>Extract</span>
          </Card>
          <Card className="flex items-center gap-3 bg-white/55 px-[14px] py-3 font-mono text-[0.82rem] uppercase tracking-[0.04em] text-[var(--muted)]">
            <span className="text-[var(--accent-strong)]">03</span>
            <span>Return later</span>
          </Card>
        </div>
      </aside>

      <section className="grid gap-6">
        <section className="grid content-center gap-4 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)] p-5 backdrop-blur-[18px] md:min-h-[280px] md:p-8">
          <div className="grid gap-4">
            <p className="inline-flex w-fit items-center rounded-full bg-[var(--accent-soft)] px-3 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
              Upload
            </p>
            <div>
              <h2 className="mb-2 text-[clamp(2rem,4vw,3.25rem)] leading-[0.95] tracking-[-0.05em]">Start extraction</h2>
              <p className="max-w-[58ch] text-base leading-7 text-[var(--muted)]">
                Choose the PDF and move straight into the structured profile workspace.
              </p>
            </div>
          </div>
          <UploadForm />
        </section>

        <section className="grid gap-4 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)] p-5 backdrop-blur-[18px] md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid gap-2">
              <p className="inline-flex w-fit items-center rounded-full bg-[var(--accent-soft)] px-3 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                Library
              </p>
              <div>
                <h2 className="mb-2 text-[clamp(1.8rem,3vw,2.5rem)] leading-[0.95] tracking-[-0.05em]">Parsed profiles</h2>
                <p className="max-w-[58ch] text-base leading-7 text-[var(--muted)]">
                  Open a saved profile, review the parsed output, or jump straight back into chat.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              {visibleProfiles.length} saved
            </span>
          </div>

          {companyOptions.length > 0 ? (
            <form action="/" className="flex flex-wrap items-end gap-3 rounded-[20px] border border-[color:var(--line)] bg-white/55 p-4">
              <label className="grid gap-2">
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Filter by company</span>
                <select
                  className="min-h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm text-[var(--ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(211,93,49,0.24)]"
                  name="company"
                  defaultValue={companyFilter}
                >
                  <option value="">All companies</option>
                  {companyOptions.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit">Apply</Button>
              {companyFilter ? (
                <Button asChild variant="ghost">
                  <Link href="/">Clear</Link>
                </Button>
              ) : null}
            </form>
          ) : null}

          {profiles.length === 0 ? (
            <Card className="grid gap-3 bg-white/60">
              <p className="m-0 text-lg tracking-[-0.03em]">No parsed profiles yet</p>
              <p className="m-0 max-w-[58ch] text-sm leading-7 text-[var(--muted)]">
                After a LinkedIn PDF finishes parsing, it will stay here so the same browser can reopen the profile and
                continue the conversation later.
              </p>
            </Card>
          ) : visibleProfiles.length === 0 ? (
            <Card className="grid gap-3 bg-white/60">
              <p className="m-0 text-lg tracking-[-0.03em]">No profiles for this company</p>
              <p className="m-0 max-w-[58ch] text-sm leading-7 text-[var(--muted)]">
                No saved profiles matched <strong>{companyFilter.toUpperCase()}</strong>. Clear the filter to see the full library.
              </p>
            </Card>
          ) : (
            <ul className="grid list-none gap-4 p-0">
              {visibleProfiles.map((profile) => (
                <li key={profile.profileId}>
                  <Card className="grid gap-4 bg-white/60">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="m-0 text-2xl tracking-[-0.04em]">{profile.fullName}</h3>
                          <span className="inline-flex items-center rounded-full bg-[rgba(35,27,24,0.07)] px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]">
                            {profile.threadId ? "Chat saved" : "Profile ready"}
                          </span>
                          {profile.currentCompany ? (
                            <span className="inline-flex items-center rounded-full bg-[var(--accent-soft)] px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                              {profile.currentCompany.toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                        <p className="m-0 max-w-[62ch] text-sm leading-7 text-[var(--muted)]">
                          {profile.headline ?? "No headline was extracted."}
                          {profile.location ? ` • ${profile.location}` : ""}
                        </p>
                      </div>
                      <div className="grid gap-2 text-right text-sm text-[var(--muted)]">
                        <span>Parsed {formatDate(profile.parsedAt)}</span>
                        <span>{profile.lastChattedAt ? `Last chatted ${formatDate(profile.lastChattedAt)}` : "No chat yet"}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="m-0 font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                        Source {profile.filename}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button asChild variant="ghost">
                          <Link href={`/profiles/${profile.profileId}`}>Open profile</Link>
                        </Button>
                        <Button asChild>
                          <Link href={`/profiles/${profile.profileId}?tab=chat`}>
                            {profile.threadId ? "Resume chat" : "Start chat"}
                          </Link>
                        </Button>
                        <DeleteProfileButton
                          profileId={profile.profileId}
                          profileName={profile.fullName}
                          className="border-[#e5b8b8] bg-[#fff4f4] text-[#9f2f2f] hover:bg-[#ffe9e9]"
                        />
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
