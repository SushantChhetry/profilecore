import { describe, expect, it } from "vitest";

import { trimTranscript } from "../lib/openai";

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
