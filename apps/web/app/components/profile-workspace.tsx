import type { Route } from "next";
import Link from "next/link";

import type { ProfileWorkspaceModel } from "@/lib/profile-ui";

import { ChatPanel } from "./chat-panel";
import { ProfileTabs } from "./profile-tabs";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const heroActionButtonClassName = "whitespace-nowrap lg:min-h-11 lg:px-4 lg:py-2.5";

export function ProfileWorkspace({
  profileId,
  defaultTab,
  starterPrompt,
  model,
  trailingActions,
}: {
  profileId: string;
  defaultTab: string;
  starterPrompt?: string;
  model: ProfileWorkspaceModel;
  trailingActions?: React.ReactNode;
}) {
  return (
    <main className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-6 py-8">
      <ProfileHero profileId={profileId} model={model} trailingActions={trailingActions} />
      <ProfileTabs
        profileId={profileId}
        defaultTab={defaultTab}
        items={[
          {
            id: "overview",
            label: "Overview",
            content: <OverviewTab profileId={profileId} model={model} />,
          },
          {
            id: "experience",
            label: <TabLabel count={model.experience.length} label="Experience" />,
            content: <ExperienceTab model={model} />,
          },
          {
            id: "education",
            label: <TabLabel count={model.education.length} label="Education" />,
            content: <EducationTab model={model} />,
          },
          {
            id: "skills",
            label: <TabLabel count={model.spotlightSkills.length + model.additionalSkills.length} label="Skills" />,
            content: <SkillsTab model={model} />,
          },
          {
            id: "chat",
            label: "Chat",
            content: <ChatTab profileId={profileId} starterPrompt={starterPrompt} model={model} />,
          },
        ]}
      />
    </main>
  );
}

function ProfileHero({
  profileId,
  model,
  trailingActions,
}: {
  profileId: string;
  model: ProfileWorkspaceModel;
  trailingActions?: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 rounded-[32px] border border-[color:var(--line)] bg-[linear-gradient(145deg,rgba(255,248,239,0.96),rgba(255,242,230,0.9))] p-6 shadow-[0_16px_60px_rgba(87,48,24,0.09)] backdrop-blur-[18px] lg:grid-cols-[1.18fr_0.82fr] lg:p-8">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex w-fit items-center rounded-full bg-[var(--accent-soft)] px-3 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
            Profile workspace
          </span>
          <span className="inline-flex w-fit items-center rounded-full border border-[color:rgba(211,93,49,0.25)] bg-white/75 px-3 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
            {model.qualityLabel}
          </span>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3">
            <h1 className="m-0 text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] tracking-[-0.06em]">{model.fullName}</h1>
            <p className="m-0 max-w-[62ch] text-[1.02rem] leading-8 text-[var(--muted)]">
              {model.headline ?? "Headline was not extracted."}
              {model.location ? ` • ${model.location}` : ""}
            </p>
          </div>

          <Card className="max-w-[720px] bg-white/76">
            <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Current focus</p>
            <p className="mb-0 mt-3 max-w-[58ch] text-base leading-7 text-[var(--ink)]">{model.currentFocus}</p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild className={heroActionButtonClassName}>
            <Link href={buildProfileHref(profileId, "chat")}>Open AI chat</Link>
          </Button>
          <Button asChild className={heroActionButtonClassName} variant="ghost">
            <Link href={buildProfileHref(profileId, "experience")}>View experience</Link>
          </Button>
          <Button asChild className={heroActionButtonClassName} variant="ghost">
            <a href={`/api/v1/profiles/${profileId}/export`}>Download JSON</a>
          </Button>
          {trailingActions}
        </div>
      </div>

      <aside className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {model.heroStats.map((stat) => (
            <Card key={stat.label} className="grid gap-2 bg-white/74">
              <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">{stat.label}</p>
              <p className="m-0 text-sm leading-6 text-[var(--ink)]">{stat.value}</p>
            </Card>
          ))}
        </div>

        <Card className="bg-white/74">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Source and quality</p>
              <span className="flex items-center gap-2">
                <span className="inline-flex rounded-full bg-[rgba(35,27,24,0.07)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  {model.warnings.length === 0 ? "No warnings" : `${model.warnings.length} warning${model.warnings.length === 1 ? "" : "s"}`}
                </span>
                <span className="inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/70 text-[var(--muted)] transition-transform group-open:rotate-180">
                  <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
                    <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </span>
              </span>
            </summary>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {model.trustFacts.map((fact) => (
                  <div key={fact.label} className="grid gap-1">
                    <p className="m-0 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{fact.label}</p>
                    <p className="m-0 text-sm leading-6 text-[var(--ink)]">{fact.value}</p>
                  </div>
                ))}
              </div>
              {model.warnings.length > 0 ? (
                <div className="grid gap-2 rounded-[18px] border border-[color:rgba(211,93,49,0.2)] bg-[rgba(211,93,49,0.08)] p-4">
                  {model.warnings.map((warning) => (
                    <p className="m-0 text-sm leading-6 text-[var(--ink)]" key={warning}>
                      {warning}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </details>
        </Card>
      </aside>
    </section>
  );
}

function OverviewTab({ profileId, model }: { profileId: string; model: ProfileWorkspaceModel }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
      <div className="grid gap-4">
        <Card className="grid gap-4">
          <div className="grid gap-2">
            <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">About</p>
            <h2 className="m-0 text-2xl tracking-[-0.04em]">What stands out</h2>
          </div>
          <p className="m-0 max-w-[62ch] text-base leading-7 text-[var(--muted)]">
            {model.summary ?? "The parser did not extract a summary section, so the profile is relying on structured experience, education, and skills."}
          </p>
        </Card>

        <Card className="grid gap-4">
          <div className="grid gap-2">
            <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Career snapshot</p>
            <h2 className="m-0 text-2xl tracking-[-0.04em]">Fast read</h2>
          </div>
          {model.careerHighlights.length > 0 ? (
            <div className="grid gap-3">
              {model.careerHighlights.map((highlight) => (
                <div
                  className="grid gap-1 rounded-[18px] border border-[color:var(--line)] bg-white/60 px-4 py-3"
                  key={`${highlight.label}-${highlight.text}`}
                >
                  <p className="m-0 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[var(--muted)]">{highlight.label}</p>
                  <p className="m-0 text-sm leading-6 text-[var(--ink)]">{highlight.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm leading-7 text-[var(--muted)]">There is not enough structured data yet to build a career snapshot.</p>
          )}
        </Card>

        <InspectDataCard inspectJson={model.inspectJson} />
      </div>

      <aside className="grid gap-4">
        <Card className="grid gap-4">
          <div className="grid gap-2">
            <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Links</p>
            <h2 className="m-0 text-2xl tracking-[-0.04em]">Profile references</h2>
          </div>
          {model.links.length > 0 ? (
            <div className="grid gap-3">
              {model.links.map((link) => (
                <a
                  className="rounded-[18px] border border-[color:var(--line)] bg-white/65 px-4 py-3 transition hover:-translate-y-0.5"
                  href={link.href}
                  key={link.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <p className="m-0 text-sm font-medium text-[var(--ink)]">{link.label}</p>
                  <p className="m-0 mt-1 text-sm leading-6 text-[var(--muted)]">{link.caption}</p>
                </a>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm leading-7 text-[var(--muted)]">No external links were extracted from the uploaded document.</p>
          )}
        </Card>

        <Card className="grid gap-4">
          <div className="grid gap-2">
            <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Top skills</p>
            <h2 className="m-0 text-2xl tracking-[-0.04em]">What this profile emphasizes</h2>
          </div>
          {model.spotlightSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {model.spotlightSkills.map((skill) => (
                <span
                  className="inline-flex items-center rounded-full border border-[color:rgba(211,93,49,0.18)] bg-[rgba(211,93,49,0.08)] px-3 py-2 font-mono text-[12px] text-[var(--accent-strong)]"
                  key={skill.name}
                >
                  {skill.name}
                  {skill.endorsementCount ? <span className="ml-2 text-[11px] text-[var(--muted)]">{skill.endorsementCount}</span> : null}
                </span>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm leading-7 text-[var(--muted)]">No skills were extracted for this profile.</p>
          )}
        </Card>

        <Card className="grid gap-4">
          <div className="grid gap-2">
            <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">AI prompts</p>
            <h2 className="m-0 text-2xl tracking-[-0.04em]">Start from a useful question</h2>
          </div>
          <div className="grid gap-3">
            {model.chatPrompts.map((prompt) => (
              <Button asChild className="justify-start" key={prompt} variant="ghost">
                <Link href={buildProfileHref(profileId, "chat", prompt)}>{prompt}</Link>
              </Button>
            ))}
          </div>
        </Card>

        <Card className="grid gap-4">
          <div className="grid gap-2">
            <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Profile quality</p>
            <h2 className="m-0 text-2xl tracking-[-0.04em]">{model.qualityLabel}</h2>
          </div>
          {model.qualityNotes.length > 0 ? (
            <div className="grid gap-2">
              {model.qualityNotes.map((note) => (
                <p className="m-0 text-sm leading-6 text-[var(--muted)]" key={note}>
                  {note}
                </p>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm leading-7 text-[var(--muted)]">
              Summary, structured history, and profile links all look populated. This profile is ready for browsing and chat.
            </p>
          )}
        </Card>
      </aside>
    </section>
  );
}

function ExperienceTab({ model }: { model: ProfileWorkspaceModel }) {
  if (model.experience.length === 0) {
    return (
      <Card className="grid gap-3">
        <h2 className="m-0 text-2xl tracking-[-0.04em]">Experience</h2>
        <p className="m-0 text-sm leading-7 text-[var(--muted)]">No experience entries were extracted from this document.</p>
      </Card>
    );
  }

  return (
    <section className="grid gap-5">
      <Card className="grid gap-3">
        <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Career timeline</p>
        <h2 className="m-0 text-2xl tracking-[-0.04em]">Work history</h2>
        <p className="m-0 max-w-[62ch] text-sm leading-7 text-[var(--muted)]">
          This section emphasizes chronology first so the current role and recent transitions are visible without reading every line.
        </p>
      </Card>

      <ol className="relative grid list-none gap-4 p-0 before:absolute before:bottom-2 before:left-[1.22rem] before:top-2 before:w-px before:bg-[color:rgba(35,27,24,0.12)]">
        {model.experience.map((item) => (
          <li className="relative pl-12" key={item.id}>
            <span
              className={
                item.isCurrent
                  ? "absolute left-2 top-6 h-4 w-4 rounded-full border-[3px] border-white bg-[var(--accent)] shadow-[0_0_0_4px_rgba(211,93,49,0.14)]"
                  : "absolute left-[0.58rem] top-[1.55rem] h-3 w-3 rounded-full border border-[color:var(--line)] bg-white"
              }
            />
            <Card className={item.isCurrent ? "grid gap-4 border-[color:rgba(211,93,49,0.25)] bg-[rgba(211,93,49,0.07)]" : "grid gap-4 bg-white/72"}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid gap-2">
                  <div className="flex flex-wrap gap-2">
                    {item.isCurrent ? (
                      <span className="inline-flex rounded-full bg-[var(--accent)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white">
                        Current role
                      </span>
                    ) : null}
                    {item.dateRange ? (
                      <span className="inline-flex rounded-full bg-white/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                        {item.dateRange}
                      </span>
                    ) : null}
                    {item.duration ? (
                      <span className="inline-flex rounded-full bg-white/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                        {item.duration}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-1">
                    <h3 className="m-0 text-xl tracking-[-0.03em]">{item.role}</h3>
                    <p className="m-0 text-sm leading-6 text-[var(--muted)]">
                      {item.company}
                      {item.location ? ` • ${item.location}` : ""}
                    </p>
                  </div>
                </div>
              </div>
              {item.description ? <p className="m-0 max-w-[70ch] text-sm leading-7 text-[var(--ink)]">{item.description}</p> : null}
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EducationTab({ model }: { model: ProfileWorkspaceModel }) {
  return (
    <section className="grid gap-5">
      <Card className="grid gap-3">
        <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Education</p>
        <h2 className="m-0 text-2xl tracking-[-0.04em]">Academic history</h2>
        <p className="m-0 max-w-[58ch] text-sm leading-7 text-[var(--muted)]">
          Degrees and fields of study are grouped into cleaner cards so the profile reads more like a person than a JSON record.
        </p>
      </Card>

      {model.education.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {model.education.map((item) => (
            <Card className="grid gap-3 bg-white/72" key={item.id}>
              <div className="flex flex-wrap gap-2">
                {item.dateRange ? (
                  <span className="inline-flex rounded-full bg-[rgba(35,27,24,0.07)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    {item.dateRange}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-1">
                <h3 className="m-0 text-lg tracking-[-0.03em]">{item.school}</h3>
                <p className="m-0 text-sm leading-6 text-[var(--muted)]">{item.degreeLine ?? "Degree information was not extracted."}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/72">
          <p className="m-0 text-sm leading-7 text-[var(--muted)]">No education entries were extracted from this document.</p>
        </Card>
      )}
    </section>
  );
}

function SkillsTab({ model }: { model: ProfileWorkspaceModel }) {
  const allSkills = [...model.spotlightSkills, ...model.additionalSkills];

  return (
    <section className="grid gap-5">
      <Card className="grid gap-3">
        <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Skills</p>
        <h2 className="m-0 text-2xl tracking-[-0.04em]">Areas this profile signals most often</h2>
        <p className="m-0 max-w-[58ch] text-sm leading-7 text-[var(--muted)]">
          The leading skills are surfaced first, with the full extracted set still available below.
        </p>
      </Card>

      {allSkills.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="grid gap-4">
            <div className="grid gap-2">
              <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Spotlight</p>
              <h3 className="m-0 text-xl tracking-[-0.03em]">Highest-signal skills</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {model.spotlightSkills.map((skill) => (
                <span
                  className="inline-flex items-center rounded-full border border-[color:rgba(211,93,49,0.18)] bg-[rgba(211,93,49,0.08)] px-4 py-2 font-mono text-[12px] text-[var(--accent-strong)]"
                  key={skill.name}
                >
                  {skill.name}
                  {skill.endorsementCount ? <span className="ml-2 text-[11px] text-[var(--muted)]">{skill.endorsementCount}</span> : null}
                </span>
              ))}
            </div>
          </Card>

          <Card className="grid gap-4">
            <div className="grid gap-2">
              <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Full set</p>
              <h3 className="m-0 text-xl tracking-[-0.03em]">All extracted skills</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {allSkills.map((skill) => (
                <span
                  className="inline-flex items-center rounded-full bg-[rgba(35,27,24,0.07)] px-3 py-1.5 font-mono text-[12px] text-[var(--muted)]"
                  key={`${skill.name}-all`}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="bg-white/72">
          <p className="m-0 text-sm leading-7 text-[var(--muted)]">No skills were extracted from this document.</p>
        </Card>
      )}
    </section>
  );
}

function ChatTab({
  profileId,
  starterPrompt,
  model,
}: {
  profileId: string;
  starterPrompt?: string;
  model: ProfileWorkspaceModel;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.74fr_1.26fr] xl:items-start">
      <aside className="grid gap-4">
        <Card className="grid gap-3">
          <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">How to use chat</p>
          <h2 className="m-0 text-2xl tracking-[-0.04em]">Ask for briefings, outreach, or talking points</h2>
          <p className="m-0 text-sm leading-7 text-[var(--muted)]">
            Responses stay grounded in the saved structured profile, so the fastest prompts are about summaries, introductions, context before a meeting, and conversation starters.
          </p>
        </Card>

        <Card className="grid gap-3">
          <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Suggested starts</p>
          <div className="grid gap-3">
            {model.chatPrompts.map((prompt) => (
              <Button asChild className="justify-start" key={prompt} variant="ghost">
                <Link href={buildProfileHref(profileId, "chat", prompt)}>{prompt}</Link>
              </Button>
            ))}
          </div>
        </Card>

        <Card className="grid gap-3">
          <p className="m-0 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">Grounding</p>
          <p className="m-0 text-sm leading-7 text-[var(--muted)]">
            The assistant only uses the saved profile JSON and prior thread messages. It is not browsing the web or inventing extra background about {model.firstName}.
          </p>
        </Card>
      </aside>

      <div className="rounded-[28px] border border-[color:var(--line)] bg-[var(--panel)] p-6 backdrop-blur-[18px]">
        <ChatPanel
          introMessage={`Ask for a quick briefing, a warmer intro, or talking points tailored to ${model.firstName}'s background.`}
          profileId={profileId}
          profileName={model.fullName}
          quickActions={model.chatPrompts}
          starterPrompt={starterPrompt}
        />
      </div>
    </section>
  );
}

function InspectDataCard({ inspectJson }: { inspectJson: string }) {
  return (
    <Card className="bg-[#1f1815] text-[#f6eadf]">
      <details className="group">
        <summary className="cursor-pointer list-none font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[#e9c8ae]">
          Inspect structured data
        </summary>
        <p className="mb-0 mt-4 max-w-[58ch] text-sm leading-7 text-[#f2dfcf]">
          This is still available for debugging and export workflows, but it no longer sits in the primary tab navigation.
        </p>
        <pre className="mt-4 overflow-auto rounded-[18px] border border-[color:rgba(246,234,223,0.14)] bg-[rgba(15,11,9,0.75)] p-[18px] font-mono text-[0.85rem] leading-6 text-[#f6eadf]">
          {inspectJson}
        </pre>
      </details>
    </Card>
  );
}

function TabLabel({ count, label }: { count: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[rgba(35,27,24,0.08)] px-2 py-0.5 font-mono text-[11px] text-[var(--muted)]">
        {count}
      </span>
    </span>
  );
}

function buildProfileHref(profileId: string, tab: string, starterPrompt?: string): Route {
  const params = new URLSearchParams();
  params.set("tab", tab);

  if (starterPrompt) {
    params.set("starterPrompt", starterPrompt);
  }

  return `/profiles/${profileId}?${params.toString()}` as Route;
}
