import { NextResponse, type NextRequest } from "next/server";

import { listMessages, sendMessageToThread } from "@/lib/data";
import { AppError, toErrorResponse } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertApiAccess, resolveOwnerKey, withOwnerCookie } from "@/lib/request-context";

export async function GET(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    assertApiAccess(request);
    const ownerKey = resolveOwnerKey(request);

    const { threadId } = await params;
    const messages = await listMessages(threadId, ownerKey);

    const response = NextResponse.json({ messages });
    return withOwnerCookie(request, response, ownerKey);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    assertApiAccess(request);
    const ownerKey = resolveOwnerKey(request);
    await assertRateLimit(ownerKey, "chat:message");

    const body = (await request.json()) as {
      content?: string;
    };

    if (!body.content?.trim()) {
      throw new AppError(400, "invalid_prompt", "content is required.");
    }

    const { threadId } = await params;
    const result = await sendMessageToThread(threadId, body.content.trim(), ownerKey);

    const response = NextResponse.json(result);
    return withOwnerCookie(request, response, ownerKey);
  } catch (error) {
    return toErrorResponse(error);
  }
}
