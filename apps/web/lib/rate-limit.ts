import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "./env";
import { AppError } from "./errors";

const ratelimit = env.upstashUrl && env.upstashToken
  ? new Ratelimit({
      redis: new Redis({
        url: env.upstashUrl,
        token: env.upstashToken,
      }),
      limiter: Ratelimit.fixedWindow(20, "10 m"),
      prefix: "profilecore:v1",
    })
  : null;

export async function assertRateLimit(identifier: string, route: string): Promise<void> {
  if (!ratelimit) {
    return;
  }

  const result = await ratelimit.limit(`${route}:${identifier}`);

  if (!result.success) {
    throw new AppError(429, "rate_limited", "Rate limit exceeded.");
  }
}

