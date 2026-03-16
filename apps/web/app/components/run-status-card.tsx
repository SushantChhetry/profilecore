"use client";

import * as Progress from "@radix-ui/react-progress";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "./ui/button";
import { Card } from "./ui/card";

type RunPayload = {
  run: {
    id: string;
    status: "queued" | "processing" | "succeeded" | "failed";
    error_code: string | null;
    error_message: string | null;
    created_at: string;
    started_at: string | null;
    finished_at: string | null;
  };
  profileId: string | null;
};

export function RunStatusCard({ runId, initialPayload }: { runId: string; initialPayload: RunPayload }) {
  const router = useRouter();
  const [payload, setPayload] = useState(initialPayload);
  const [pollError, setPollError] = useState<string | null>(null);

  const progressValue = payload.run.status === "queued" ? 32 : payload.run.status === "processing" ? 72 : 100;
  const stages = useMemo(() => {
    const queueActive = payload.run.status === "queued";
    const aiActive = payload.run.status === "processing";
    const structuredComplete = payload.run.status === "succeeded";
    const failed = payload.run.status === "failed";

    return [
      {
        title: "Upload locked in",
        detail: "Your PDF reached storage and the app created an extraction run.",
        state: "complete" as const,
      },
      {
        title: "Waiting for parser worker",
        detail: "The job is sitting in the queue until a worker claims it and prepares the document.",
        state: failed ? "complete" : queueActive ? "active" : "complete",
      },
      {
        title: "AI is reading and normalizing the resume",
        detail: "We extract the text, identify profile sections, and map them into the canonical schema.",
        state: failed ? "complete" : aiActive ? "active" : structuredComplete ? "complete" : "pending",
      },
      {
        title: "Building the profile workspace",
        detail: "The app saves the structured profile, links it to this run, and prepares the tabs/chat surface.",
        state: failed ? "complete" : structuredComplete ? "complete" : aiActive ? "active" : "pending",
      },
      {
        title: "Profile ready",
        detail: payload.profileId
          ? "The workspace is ready. We can open it automatically."
          : "Waiting for the saved profile record to be linked to this run.",
        state: payload.profileId ? "complete" : failed ? "pending" : payload.run.status === "succeeded" ? "active" : "pending",
      },
    ];
  }, [payload.profileId, payload.run.status]);

  useEffect(() => {
    if (payload.run.status === "failed" || payload.run.status === "succeeded") {
      return;
    }

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/v1/extraction-runs/${runId}`);

      if (!response.ok) {
        setPollError("We are still processing your profile, but status refresh is temporarily unavailable.");
        return;
      }

      const nextPayload = (await response.json()) as RunPayload;
      setPollError(null);
      setPayload(nextPayload);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [payload.run.status, runId]);

  useEffect(() => {
    if (payload.run.status === "succeeded" && payload.profileId) {
      const timeout = window.setTimeout(() => {
        router.replace(`/profiles/${payload.profileId}`);
      }, 1400);

      return () => window.clearTimeout(timeout);
    }
  }, [payload.profileId, payload.run.status, router]);

  const statusLabel =
    payload.run.status === "queued"
      ? "Queued for parsing"
      : payload.run.status === "processing"
        ? "AI is structuring the profile"
        : payload.run.status === "succeeded"
          ? "Profile created"
          : "Extraction failed";

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 rounded-[28px] border border-[color:var(--line)] bg-[linear-gradient(145deg,rgba(255,248,239,0.94),rgba(255,241,228,0.86))] p-6 shadow-[0_16px_60px_rgba(87,48,24,0.08)] md:p-8">
        <div className="grid gap-4">
          <p className="inline-flex w-fit items-center rounded-full bg-[var(--accent-soft)] px-3 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
            Extraction in progress
          </p>
          <div className="grid gap-3">
            <h1 className="m-0 text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.92] tracking-[-0.05em]">
              {payload.run.status === "succeeded" ? "Profile is ready" : "We’re building your profile workspace"}
            </h1>
            <p className="max-w-[62ch] text-base leading-7 text-[var(--muted)]">
              {payload.run.status === "queued" &&
                "The app has the document and is waiting for a parser worker to pick up the extraction job."}
              {payload.run.status === "processing" &&
                "The parser worker is reading the PDF, extracting relevant signals, and asking the model to structure the result into your profile schema."}
              {payload.run.status === "succeeded" &&
                "The structured profile has been saved. Opening the workspace now so you can review and chat with it."}
              {payload.run.status === "failed" &&
                "The extraction run stopped before the profile could be created. You can retry with another upload or inspect the error below."}
            </p>
          </div>
        </div>

        <Card className="grid gap-4 bg-white/70">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={
                payload.run.status === "failed"
                  ? "inline-flex rounded-full bg-[#fce8e8] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#b22222]"
                  : "inline-flex rounded-full bg-[rgba(35,27,24,0.07)] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]"
              }
            >
              {statusLabel}
            </span>
            <span className="font-mono text-xs text-[var(--muted)]">Run {runId.slice(0, 8)}</span>
          </div>
          <Progress.Root
            className="relative h-3 w-full overflow-hidden rounded-full bg-[rgba(35,27,24,0.08)]"
            value={progressValue}
          >
            <Progress.Indicator
              className="h-full w-full bg-[linear-gradient(90deg,var(--accent),#e09f54)] transition-transform duration-300"
              style={{ transform: `translateX(-${100 - progressValue}%)` }}
            />
          </Progress.Root>
          <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <span>{progressValue}% complete</span>
            <span>{payload.run.status === "succeeded" && payload.profileId ? "Redirecting..." : "Live status updates every 2.5s"}</span>
          </div>
          {payload.run.error_message ? <p className="m-0 text-sm text-[#b22222]">{payload.run.error_message}</p> : null}
          {pollError ? <p className="m-0 text-sm text-[#8a4a10]">{pollError}</p> : null}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)] p-6 backdrop-blur-[18px]">
          <div className="mb-5">
            <h2 className="m-0 text-2xl tracking-[-0.04em]">What the system is doing</h2>
            <p className="mt-2 max-w-[58ch] text-sm leading-7 text-[var(--muted)]">
              This view stays active so the process feels legible instead of looking stuck on an opaque job id.
            </p>
          </div>
          <ol className="grid gap-4">
            {stages.map((stage, index) => {
              const isActive = stage.state === "active";
              const isComplete = stage.state === "complete";

              return (
                <li
                  key={stage.title}
                  className={
                    isActive
                      ? "grid gap-2 rounded-[20px] border border-[color:rgba(211,93,49,0.3)] bg-[rgba(211,93,49,0.08)] p-4"
                      : "grid gap-2 rounded-[20px] border border-[color:var(--line)] bg-white/55 p-4"
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        isComplete
                          ? "grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white"
                          : isActive
                            ? "grid h-8 w-8 place-items-center rounded-full border border-[color:rgba(211,93,49,0.35)] bg-white font-semibold text-[var(--accent-strong)]"
                            : "grid h-8 w-8 place-items-center rounded-full border border-[color:var(--line)] bg-white font-semibold text-[var(--muted)]"
                      }
                    >
                      {isComplete ? "✓" : index + 1}
                    </span>
                    <div>
                      <h3 className="m-0 text-base">{stage.title}</h3>
                      <p className="m-0 text-xs font-mono uppercase tracking-[0.12em] text-[var(--muted)]">
                        {isComplete ? "Complete" : isActive ? "In progress" : "Pending"}
                      </p>
                    </div>
                  </div>
                  <p className="m-0 max-w-[58ch] text-sm leading-7 text-[var(--muted)]">{stage.detail}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="grid gap-4">
          <Card className="grid gap-3 bg-white/70">
            <p className="m-0 font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">What the AI is doing</p>
            <p className="m-0 text-sm leading-7 text-[var(--muted)]">
              The model is not generating freeform text first. It is being used to infer profile structure, normalize
              dates, roles, schools, skills, and produce a schema-valid profile object the app can trust.
            </p>
          </Card>
          <Card className="grid gap-3 bg-white/70">
            <p className="m-0 font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Next step</p>
            <p className="m-0 text-sm leading-7 text-[var(--muted)]">
              As soon as the profile record is available, this page redirects into the profile workspace automatically.
            </p>
          </Card>
        </aside>
      </div>

      <div className="flex flex-wrap gap-3">
        {payload.profileId ? (
          <Button asChild>
            <Link href={`/profiles/${payload.profileId}`}>Open profile</Link>
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link href="/">Back to upload</Link>
        </Button>
      </div>
    </section>
  );
}
