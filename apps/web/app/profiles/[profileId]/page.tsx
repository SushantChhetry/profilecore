import Link from "next/link";

import type { EducationItem, ExperienceItem, SkillItem } from "@profilecore/profile-schema";

import { getProfileById } from "@/lib/data";

import { ChatPanel } from "../../components/chat-panel";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "raw-json", label: "Raw JSON" },
  { id: "chat", label: "Chat" },
] as const;

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
  const profile = await getProfileById(profileId);

  return (
    <main className="shell grid">
      <section className="panel stack">
        <div className="button-row">
          <span className="eyebrow">Structured profile</span>
          <Link className="ghost-button" href={`/api/v1/profiles/${profileId}/export`}>
            Download JSON
          </Link>
        </div>
        <div className="stack">
          <h1 className="page-title">{profile.full_name}</h1>
          <p className="muted">
            {profile.headline ?? "No headline was extracted."}
            {profile.location ? ` • ${profile.location}` : ""}
          </p>
        </div>
        <nav className="tab-row" aria-label="Profile tabs">
          {tabs.map((entry) => (
            <Link
              key={entry.id}
              className={`tab ${tab === entry.id ? "active" : ""}`}
              href={`/profiles/${profileId}?tab=${entry.id}`}
            >
              {entry.label}
            </Link>
          ))}
        </nav>
      </section>

      {tab === "overview" ? (
        <section className="grid two">
          <div className="panel stack">
            <div className="card">
              <p className="eyebrow">Summary</p>
              <p className="muted">{profile.canonical_json.person.summary ?? "No summary section was extracted."}</p>
            </div>
            <div className="card">
              <p className="eyebrow">Links</p>
              <pre className="pre">{JSON.stringify(profile.canonical_json.links, null, 2)}</pre>
            </div>
          </div>
          <aside className="panel stack">
            <div className="card">
              <p className="eyebrow">Warnings</p>
              <ul className="list">
                {profile.canonical_json.metadata.extractionWarnings.length > 0 ? (
                  profile.canonical_json.metadata.extractionWarnings.map((warning: string) => <li key={warning}>{warning}</li>)
                ) : (
                  <li>No extraction warnings recorded.</li>
                )}
              </ul>
            </div>
          </aside>
        </section>
      ) : null}

      {tab === "experience" ? (
        <section className="panel">
          <ul className="list">
            {profile.canonical_json.experience.map((item: ExperienceItem, index: number) => (
              <li key={`${item.company}-${item.role}-${index}`}>
                <strong>{item.role}</strong> at <strong>{item.company}</strong>
                <div className="muted">
                  {[item.startDate, item.endDate].filter(Boolean).join(" - ")}
                  {item.location ? ` • ${item.location}` : ""}
                </div>
                {item.description ? <p style={{ marginBottom: 0 }}>{item.description}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "education" ? (
        <section className="panel">
          <ul className="list">
            {profile.canonical_json.education.map((item: EducationItem, index: number) => (
              <li key={`${item.school}-${item.degree ?? "degree"}-${index}`}>
                <strong>{item.school}</strong>
                <div className="muted">
                  {[item.degree, item.fieldOfStudy].filter(Boolean).join(" • ")}
                  {item.startDate || item.endDate ? ` • ${[item.startDate, item.endDate].filter(Boolean).join(" - ")}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "skills" ? (
        <section className="panel">
          <div className="button-row">
            {profile.canonical_json.skills.map((skill: SkillItem) => (
              <span className="pill" key={skill.name}>
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "raw-json" ? (
        <section className="panel">
          <pre className="pre">{JSON.stringify(profile.canonical_json, null, 2)}</pre>
        </section>
      ) : null}

      {tab === "chat" ? (
        <section className="panel">
          <ChatPanel profileId={profileId} />
        </section>
      ) : null}
    </main>
  );
}
