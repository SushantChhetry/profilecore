import OpenAI from "openai";

import type { ParsedProfile } from "@profilecore/profile-schema";

import { env } from "./env";
import { AppError } from "./errors";

export type ChatMessageInput = {
  role: "user" | "assistant";
  content: string;
};

function trimTranscript(messages: ChatMessageInput[], maxCharacters = 6000): ChatMessageInput[] {
  const reversed = [...messages].reverse();
  const kept: ChatMessageInput[] = [];
  let consumed = 0;

  for (const message of reversed) {
    consumed += message.content.length;

    if (consumed > maxCharacters && kept.length > 0) {
      break;
    }

    kept.push(message);
  }

  return kept.reverse();
}

function buildSystemPrompt(profile: ParsedProfile): string {
  return [
    "You are ProfileCore, an assistant that answers using only the structured profile provided.",
    "Prefer concise, concrete answers that help with networking, research, and introductions.",
    "If information is missing from the profile, say that directly instead of inventing it.",
    "",
    "Structured profile:",
    JSON.stringify(profile, null, 2),
  ].join("\n");
}

function buildMockReply(profile: ParsedProfile, prompt: string): string {
  const experience = profile.experience[0];
  const skills = profile.skills.slice(0, 3).map((skill) => skill.name).join(", ");

  return [
    `Profile summary for ${profile.person.fullName}:`,
    `${profile.person.headline ?? "No headline supplied."}`,
    experience ? `Most recent visible role: ${experience.role} at ${experience.company}.` : "No experience entries were extracted.",
    skills ? `Top visible skills: ${skills}.` : "No skills were extracted.",
    `Prompt received: ${prompt}`,
  ].join(" ");
}

type AnthropicErrorPayload = {
  error?: {
    type?: string;
    message?: string;
  };
  request_id?: string;
};

export async function readAnthropicErrorMessage(response: Response, model: string): Promise<string> {
  const rawBody = (await response.text()).trim();
  let errorType = "";
  let errorMessage = rawBody;
  let requestId = response.headers.get("request-id") ?? "";

  if (rawBody) {
    try {
      const payload = JSON.parse(rawBody) as AnthropicErrorPayload;
      errorType = payload.error?.type?.trim() ?? "";
      errorMessage = payload.error?.message?.trim() || rawBody;
      requestId = payload.request_id?.trim() || requestId;
    } catch {
      // Keep the raw body when Anthropic does not return structured JSON.
    }
  }

  const details = [
    `Anthropic chat request failed with status ${response.status} for model ${model}.`,
    errorType ? `Type: ${errorType}.` : "",
    errorMessage ? `Message: ${errorMessage}.` : "",
    requestId ? `Request ID: ${requestId}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return details;
}

async function generateAnthropicReply(
  profile: ParsedProfile,
  history: ChatMessageInput[],
  prompt: string,
): Promise<{ content: string; model: string }> {
  let response: Response;

  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.anthropicChatModel,
        max_tokens: 700,
        system: buildSystemPrompt(profile),
        messages: [
          ...trimTranscript(history).map((message) => ({
            role: message.role,
            content: message.content,
          })),
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error.";
    throw new AppError(
      502,
      "anthropic_chat_failed",
      `Anthropic chat request failed for model ${env.anthropicChatModel}: ${message}`,
    );
  }

  if (!response.ok) {
    throw new AppError(502, "anthropic_chat_failed", await readAnthropicErrorMessage(response, env.anthropicChatModel));
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    model?: string;
  };

  const content = payload.content
    ?.filter((block) => block.type === "text" && block.text)
    .map((block) => block.text?.trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    content: content || "No reply generated.",
    model: payload.model || env.anthropicChatModel,
  };
}

export async function generateChatReply(
  profile: ParsedProfile,
  history: ChatMessageInput[],
  prompt: string,
): Promise<{ content: string; model: string }> {
  if (env.mockOpenAi) {
    return {
      content: buildMockReply(profile, prompt),
      model: "mock-llm",
    };
  }

  if (env.anthropicApiKey) {
    return generateAnthropicReply(profile, history, prompt);
  }

  if (!env.openAiKey) {
    return {
      content: buildMockReply(profile, prompt),
      model: "mock-llm",
    };
  }

  const client = new OpenAI({
    apiKey: env.openAiKey,
  });

  const response = await client.responses.create({
    model: env.openAiChatModel,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: buildSystemPrompt(profile) }],
      },
      ...trimTranscript(history).map((message) => ({
        role: message.role,
        content: [{ type: "input_text", text: message.content }],
      })),
      {
        role: "user",
        content: [{ type: "input_text", text: prompt }],
      },
    ] as any,
  } as any);

  return {
    content: response.output_text?.trim() || "No reply generated.",
    model: response.model,
  };
}

export { trimTranscript };
