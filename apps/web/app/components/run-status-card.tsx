"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [payload, setPayload] = useState(initialPayload);

  useEffect(() => {
    if (payload.run.status === "failed" || payload.run.status === "succeeded") {
      return;
    }

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/v1/extraction-runs/${runId}`);

      if (!response.ok) {
        return;
      }

      const nextPayload = (await response.json()) as RunPayload;
      setPayload(nextPayload);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [payload.run.status, runId]);

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Extraction run</p>
        <h1 className="page-title" style={{ fontSize: "2.8rem" }}>
          {runId}
        </h1>
      </div>

      <div className="card stack">
        <span className="pill status" data-status={payload.run.status}>
          {payload.run.status}
        </span>
        <p className="muted">Queued runs are claimed by the parser worker through the database-backed claim RPC.</p>
        {payload.run.error_message ? <p style={{ color: "#b22222", margin: 0 }}>{payload.run.error_message}</p> : null}
      </div>

      <div className="button-row">
        {payload.profileId ? (
          <Link className="button" href={`/profiles/${payload.profileId}`}>
            Open profile
          </Link>
        ) : null}
        <Link className="ghost-button" href="/">
          Back to upload
        </Link>
      </div>
    </section>
  );
}

