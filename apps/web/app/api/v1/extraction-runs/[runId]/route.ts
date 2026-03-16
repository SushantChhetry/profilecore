import { getExtractionRunStatus } from "@/lib/data";
import { toErrorResponse } from "@/lib/errors";

export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const payload = await getExtractionRunStatus(runId);

    return Response.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}

