import OpenAI from "openai";

import type { ParsedProfile } from "@profilecore/profile-schema";

import { env } from "./env";

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

export async function generateChatReply(
  profile: ParsedProfile,
  history: ChatMessageInput[],
  prompt: string,
): Promise<{ content: string; model: string }> {
  if (!env.openAiKey || env.mockOpenAi) {
    return {
      content: buildMockReply(profile, prompt),
      model: "mock-openai",
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
