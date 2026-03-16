import { NextRequest } from "next/server";

import { createChatThread, sendMessageToThread } from "@/lib/data";
import { AppError, toErrorResponse } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertApiAccess, resolveOwnerKey } from "@/lib/request-context";

export async function POST(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    assertApiAccess(request);
    const ownerKey = resolveOwnerKey(request);
    await assertRateLimit(ownerKey, "chat:create-thread");

    const body = (await request.json().catch(() => ({}))) as {
      starterPrompt?: string;
      title?: string;
    };

    const { profileId } = await params;
    const thread = await createChatThread(profileId, ownerKey, body.title);

    if (body.starterPrompt?.trim()) {
      const result = await sendMessageToThread(thread.id, body.starterPrompt.trim());
      return Response.json({
        thread,
        messages: [result.userMessage, result.assistantMessage],
      });
    }

    return Response.json({ thread });
  } catch (error) {
    return toErrorResponse(error);
  }
}

