import { getExtractionRunStatus } from "@/lib/data";
import { resolveServerOwnerKey } from "@/lib/request-context";

import { RunStatusCard } from "../../components/run-status-card";

export default async function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const ownerKey = await resolveServerOwnerKey();
  const payload = await getExtractionRunStatus(runId, ownerKey);

  return (
    <main className="mx-auto w-[min(1120px,calc(100%-32px))] py-8">
      <RunStatusCard runId={runId} initialPayload={payload} />
    </main>
  );
}
