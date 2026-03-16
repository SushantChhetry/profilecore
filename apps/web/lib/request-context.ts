import { createHash } from "node:crypto";

import type { NextRequest } from "next/server";

import { env } from "./env";
import { AppError } from "./errors";

function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
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
  const explicit = request.headers.get("x-profilecore-owner");

  if (explicit) {
    return explicit.trim();
  }

  const apiKey = request.headers.get("x-api-key");

  if (apiKey) {
    return `api_${fingerprint(apiKey)}`;
  }

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  return `anon_${fingerprint(`${forwardedFor}:${userAgent}`)}`;
}

