import { getExtractionRunStatus } from "@/lib/data";

import { RunStatusCard } from "../../components/run-status-card";

export default async function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const payload = await getExtractionRunStatus(runId);

  return (
    <main className="shell">
      <RunStatusCard runId={runId} initialPayload={payload} />
    </main>
  );
}

