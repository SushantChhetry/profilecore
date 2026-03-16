import { NextResponse, type NextRequest } from "next/server";

import { getLatestChatThreadForProfile, getOrCreateChatThread, listMessages, sendMessageToThread } from "@/lib/data";
import { toErrorResponse } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertApiAccess, resolveOwnerKey, withOwnerCookie } from "@/lib/request-context";

export async function GET(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    assertApiAccess(request);
    const ownerKey = resolveOwnerKey(request);
    const { profileId } = await params;
    const thread = await getLatestChatThreadForProfile(profileId, ownerKey);
    const messages = thread ? await listMessages(thread.id, ownerKey) : [];

    const response = NextResponse.json({
      thread,
      messages,
    });

    return withOwnerCookie(request, response, ownerKey);
  } catch (error) {
    return toErrorResponse(error);
  }
}

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
    const thread = await getOrCreateChatThread(profileId, ownerKey, body.title);

    if (body.starterPrompt?.trim()) {
      const result = await sendMessageToThread(thread.id, body.starterPrompt.trim(), ownerKey);
      const response = NextResponse.json({
        thread: result.thread,
        messages: [result.userMessage, result.assistantMessage],
      });

      return withOwnerCookie(request, response, ownerKey);
    }

    const response = NextResponse.json({ thread });
    return withOwnerCookie(request, response, ownerKey);
  } catch (error) {
    return toErrorResponse(error);
  }
}
