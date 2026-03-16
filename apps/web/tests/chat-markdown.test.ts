import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChatMarkdown } from "../lib/chat-markdown";

describe("ChatMarkdown", () => {
  it("renders headings, emphasis, and bullet lists", () => {
    const html = renderToStaticMarkup(
      createElement(ChatMarkdown, {
        content: "## Briefing\n\n**Current Role:** Leads hiring.\n\n- Builds teams\n- Tracks metrics",
      }),
    );

    expect(html).toContain("<h2>Briefing</h2>");
    expect(html).toContain("<strong>Current Role:</strong>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>Builds teams</li>");
    expect(html).toContain("<li>Tracks metrics</li>");
  });

  it("renders fenced code blocks and safe links", () => {
    const html = renderToStaticMarkup(
      createElement(ChatMarkdown, {
        content: "Use [Profilecore](https://example.com).\n\n```ts\nconst ready = true;\n```",
      }),
    );

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("<pre>");
    expect(html).toContain("<code>const ready = true;");
  });

  it("does not render unsafe links as anchors", () => {
    const html = renderToStaticMarkup(
      createElement(ChatMarkdown, {
        content: "Ignore [this](javascript:alert('xss')).",
      }),
    );

    expect(html).not.toContain("<a ");
    expect(html).toContain("[this](javascript:alert(&#x27;xss&#x27;))");
  });
});
