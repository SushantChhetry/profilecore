"use client";

import type { Route } from "next";
import * as Label from "@radix-ui/react-label";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ChatMarkdown } from "@/lib/chat-markdown";

import { Button } from "./ui/button";
import { Card } from "./ui/card";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

const fallbackQuickActions = [
  "Summarize this career trajectory in five bullets.",
  "Draft a warm networking introduction for this person.",
  "Suggest three conversation starters based on this profile.",
];

const thinkingBars = [
  { widthClassName: "w-24", delay: "0ms" },
  { widthClassName: "w-36", delay: "120ms" },
  { widthClassName: "w-28", delay: "240ms" },
];

export function ChatPanel({
  profileId,
  profileName,
  quickActions = fallbackQuickActions,
  starterPrompt,
  introMessage,
}: {
  profileId: string;
  profileName: string;
  quickActions?: string[];
  starterPrompt?: string;
  introMessage?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const consumedStarterPrompt = useRef<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isPending, startTransition] = useTransition();

  const disabled = isPending || isLoadingHistory || prompt.trim().length === 0;

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        setError(null);
        const response = await fetch(`/api/v1/profiles/${profileId}/chat/threads`);
        const payload = (await response.json()) as {
          thread?: { id: string } | null;
          messages?: Message[];
          error?: { message: string };
        };

        if (!response.ok) {
          throw new Error(payload.error?.message ?? "Unable to load saved conversation.");
        }

        if (!active) {
          return;
        }

        setThreadId(payload.thread?.id ?? null);
        setMessages(
          (payload.messages ?? []).filter(
            (message): message is Message => message.role === "user" || message.role === "assistant",
          ),
        );
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load saved conversation.");
      } finally {
        if (active) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [profileId]);

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

  function submitPrompt(nextPrompt: string) {
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

  useEffect(() => {
    if (!starterPrompt || isLoadingHistory || consumedStarterPrompt.current === starterPrompt) {
      return;
    }

    consumedStarterPrompt.current = starterPrompt;

    if (messages.length === 0) {
      submitPrompt(starterPrompt);
    } else if (prompt.trim().length === 0) {
      setPrompt(starterPrompt);
    }

    if (searchParams.has("starterPrompt")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("starterPrompt");
      const query = params.toString();
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
    }
  }, [isLoadingHistory, messages.length, pathname, prompt, router, searchParams, starterPrompt]);

  return (
    <section className="grid gap-4">
      <Card className="grid gap-2 bg-white/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Saved conversation</p>
          {!isLoadingHistory ? (
            <span className="inline-flex rounded-full bg-[rgba(35,27,24,0.07)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
              {messages.length} message{messages.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        <p className="m-0 max-w-[58ch] text-sm leading-7 text-[var(--muted)]">
          {isLoadingHistory
            ? `Loading the last saved thread for ${profileName}.`
            : threadId
              ? `You can keep chatting about ${profileName} where you left off.`
              : `No saved thread yet. Your first prompt will start one for ${profileName}.`}
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Button
            key={action}
            type="button"
            variant="ghost"
            className="h-auto justify-start px-4 py-3 text-left leading-6"
            disabled={isPending || isLoadingHistory}
            onClick={() => {
              submitPrompt(action);
            }}
          >
            {action}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {isLoadingHistory ? (
          <Card>
            <p className="m-0 max-w-[58ch] text-base leading-7 text-[var(--muted)]">Loading saved messages.</p>
          </Card>
        ) : messages.length === 0 ? (
          <Card>
            <p className="m-0 max-w-[58ch] text-base leading-7 text-[var(--muted)]">
              {introMessage ??
                "Ask for a warm intro, a networking angle, or a concise summary. Responses stay grounded in the saved profile JSON only."}
            </p>
          </Card>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[92%] rounded-[18px] border border-[color:var(--line)] bg-[var(--accent-soft)] px-4 py-3 md:max-w-[85%]"
                : "max-w-[92%] rounded-[18px] border border-[color:var(--line)] bg-white/80 px-4 py-3 md:max-w-[85%]"
            }
          >
            <strong className="mb-2 block font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--muted)]">
              {message.role === "assistant" ? "Profile AI" : "You"}
            </strong>
            {message.role === "assistant" ? (
              <ChatMarkdown content={message.content} />
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-7 text-[var(--ink)]">{message.content}</div>
            )}
          </div>
        ))}

        {isPending ? (
          <div className="chat-thinking-card max-w-[92%] rounded-[18px] border border-[color:var(--line)] bg-white/80 px-4 py-3 md:max-w-[85%]">
            <strong className="mb-2 block font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--muted)]">Profile AI</strong>
            <div className="grid gap-3 overflow-hidden rounded-[14px] border border-[color:rgba(211,93,49,0.16)] bg-[linear-gradient(145deg,rgba(255,250,244,0.98),rgba(255,239,227,0.92))] px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="relative flex size-3 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-35 [animation:chat-thinking-pulse_1.7s_ease-out_infinite]" />
                  <span className="relative size-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_5px_rgba(211,93,49,0.12)]" />
                </span>
                <span className="text-sm font-semibold leading-6 text-[var(--ink)]">Thinking through this profile</span>
              </div>
              <div className="grid gap-2">
                {thinkingBars.map((bar) => (
                  <span
                    key={bar.delay}
                    className={`chat-thinking-bar h-2 rounded-full bg-[linear-gradient(90deg,rgba(211,93,49,0.22),rgba(211,93,49,0.64),rgba(224,159,84,0.5))] ${bar.widthClassName}`}
                    style={{ animationDelay: bar.delay }}
                  />
                ))}
              </div>
              <p className="m-0 text-sm leading-7 text-[var(--muted)]">
                Checking the saved profile, then shaping a grounded answer.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (disabled) {
            return;
          }
          submitPrompt(prompt.trim());
        }}
      >
        <Label.Root className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]" htmlFor="chat-prompt">
          Ask about this profile
        </Label.Root>
        <textarea
          id="chat-prompt"
          className="min-h-32 w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-4 text-sm leading-7 text-[var(--ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(211,93,49,0.24)]"
          rows={4}
          value={prompt}
          placeholder={`Ask for a summary, talking points, or an outreach draft for ${profileName}.`}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={disabled}>
            {isPending ? "Thinking..." : "Send"}
          </Button>
        </div>
        {error ? <p className="m-0 text-sm text-[#b22222]">{error}</p> : null}
      </form>
    </section>
  );
}
