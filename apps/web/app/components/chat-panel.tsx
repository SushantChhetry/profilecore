"use client";

import { useMemo, useState, useTransition } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const quickActions = [
  "Summarize this career trajectory.",
  "Generate a warm intro for networking outreach.",
  "Suggest three conversation starters based on this profile.",
];

export function ChatPanel({ profileId }: { profileId: string }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const disabled = useMemo(() => isPending || prompt.trim().length === 0, [isPending, prompt]);

  async function ensureThread(): Promise<string> {
    if (threadId) {
      return threadId;
    }

    const response = await fetch(`/api/v1/profiles/${profileId}/chat/threads`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const payload = (await response.json()) as {
      thread?: { id: string };
      error?: { message: string };
    };

    if (!response.ok || !payload.thread) {
      throw new Error(payload.error?.message ?? "Unable to create chat thread.");
    }

    setThreadId(payload.thread.id);
    return payload.thread.id;
  }

  function sendPrompt(nextPrompt: string) {
    startTransition(async () => {
      try {
        setError(null);
        const activeThreadId = await ensureThread();
        const response = await fetch(`/api/v1/chat-threads/${activeThreadId}/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ content: nextPrompt }),
        });
        const payload = (await response.json()) as {
          userMessage?: Message;
          assistantMessage?: Message;
          error?: { message: string };
        };

        if (!response.ok || !payload.userMessage || !payload.assistantMessage) {
          throw new Error(payload.error?.message ?? "Unable to send chat prompt.");
        }

        setMessages((current) => [...current, payload.userMessage!, payload.assistantMessage!]);
        setPrompt("");
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Chat request failed.");
      }
    });
  }

  return (
    <section className="stack">
      <div className="button-row">
        {quickActions.map((action) => (
          <button
            key={action}
            className="ghost-button"
            type="button"
            disabled={isPending}
            onClick={() => {
              setPrompt(action);
              sendPrompt(action);
            }}
          >
            {action}
          </button>
        ))}
      </div>

      <div className="stack">
        {messages.length === 0 ? (
          <div className="card">
            <p className="muted">
              Ask for a warm intro, a networking angle, or a concise summary. Responses stay grounded in the saved
              profile JSON only.
            </p>
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble ${message.role}`}>
            <strong style={{ display: "block", marginBottom: 8, textTransform: "capitalize" }}>{message.role}</strong>
            <div>{message.content}</div>
          </div>
        ))}
      </div>

      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (disabled) {
            return;
          }
          sendPrompt(prompt.trim());
        }}
      >
        <textarea
          className="textarea"
          rows={4}
          value={prompt}
          placeholder="Ask for a summary, talking points, or an outreach draft."
          onChange={(event) => setPrompt(event.target.value)}
        />
        <div className="button-row">
          <button className="button" type="submit" disabled={disabled}>
            {isPending ? "Thinking..." : "Send"}
          </button>
        </div>
        {error ? <p style={{ color: "#b22222", margin: 0 }}>{error}</p> : null}
      </form>
    </section>
  );
}

