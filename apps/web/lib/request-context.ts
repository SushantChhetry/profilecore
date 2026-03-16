import { createHash } from "node:crypto";

import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "./env";
import { AppError } from "./errors";

export const OWNER_COOKIE_NAME = "profilecore_owner";

type OwnerResolutionInput = {
  cookieOwner?: string | null;
  explicitOwner?: string | null;
  apiKey?: string | null;
  forwardedFor?: string | null;
  userAgent?: string | null;
};

function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function resolveOwnerKeyFromInput(input: OwnerResolutionInput): string {
  if (input.cookieOwner?.trim()) {
    return input.cookieOwner.trim();
  }

  if (input.explicitOwner?.trim()) {
    return input.explicitOwner.trim();
  }

  if (input.apiKey) {
    return `api_${fingerprint(input.apiKey)}`;
  }

  const forwardedFor = input.forwardedFor ?? "local";
  const userAgent = input.userAgent ?? "unknown";

  return `anon_${fingerprint(`${forwardedFor}:${userAgent}`)}`;
}

export function assertApiAccess(request: NextRequest): void {
  if (!env.apiKey) {
    return;
  }

  const provided = request.headers.get("x-api-key");

  if (!provided || provided !== env.apiKey) {
    throw new AppError(401, "unauthorized", "Missing or invalid API key.");
  }
}

export function resolveOwnerKey(request: NextRequest): string {
  return resolveOwnerKeyFromInput({
    cookieOwner: request.cookies.get(OWNER_COOKIE_NAME)?.value,
    explicitOwner: request.headers.get("x-profilecore-owner"),
    apiKey: request.headers.get("x-api-key"),
    forwardedFor: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  });
}

export async function resolveServerOwnerKey(): Promise<string> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  return resolveOwnerKeyFromInput({
    cookieOwner: cookieStore.get(OWNER_COOKIE_NAME)?.value,
    explicitOwner: headerStore.get("x-profilecore-owner"),
    apiKey: headerStore.get("x-api-key"),
    forwardedFor: headerStore.get("x-forwarded-for"),
    userAgent: headerStore.get("user-agent"),
  });
}

export function withOwnerCookie(request: NextRequest, response: NextResponse, ownerKey: string): NextResponse {
  const hasPersistedOwner = request.cookies.get(OWNER_COOKIE_NAME)?.value;
  const hasExplicitOwner = request.headers.get("x-profilecore-owner");
  const hasApiKey = request.headers.get("x-api-key");

  if (hasPersistedOwner || hasExplicitOwner || hasApiKey) {
    return response;
  }

  response.cookies.set({
    name: OWNER_COOKIE_NAME,
    value: ownerKey,
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
