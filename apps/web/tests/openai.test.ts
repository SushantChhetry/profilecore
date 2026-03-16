import { describe, expect, it } from "vitest";

import { readAnthropicErrorMessage, trimTranscript } from "../lib/openai";

describe("trimTranscript", () => {
  it("keeps the newest messages inside the budget", () => {
    const messages = [
      { role: "user" as const, content: "a".repeat(1000) },
      { role: "assistant" as const, content: "b".repeat(1000) },
      { role: "user" as const, content: "c".repeat(1000) },
      { role: "assistant" as const, content: "d".repeat(1000) },
    ];

    const trimmed = trimTranscript(messages, 2100);

    expect(trimmed).toHaveLength(2);
    expect(trimmed[0]?.content.startsWith("c")).toBe(true);
    expect(trimmed[1]?.content.startsWith("d")).toBe(true);
  });
});

describe("readAnthropicErrorMessage", () => {
  it("includes structured Anthropic error details", async () => {
    const response = new Response(
      JSON.stringify({
        error: {
          type: "not_found_error",
          message: "Model claude-3-5-sonnet-latest not found",
        },
        request_id: "req_123",
      }),
      {
        status: 404,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    await expect(readAnthropicErrorMessage(response, "claude-3-5-sonnet-latest")).resolves.toContain(
      "Model claude-3-5-sonnet-latest not found",
    );
  });

  it("falls back to the raw response body when the payload is not json", async () => {
    const response = new Response("upstream unavailable", {
      status: 502,
      headers: {
        "request-id": "req_456",
      },
    });

    await expect(readAnthropicErrorMessage(response, "claude-sonnet-4-20250514")).resolves.toBe(
      "Anthropic chat request failed with status 502 for model claude-sonnet-4-20250514. Message: upstream unavailable. Request ID: req_456.",
    );
  });
});
