function readRequired(name: string): string {
  return process.env[name] ?? "";
}

function readOptional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function readOptionalAlias(names: string[], fallback = ""): string {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined) {
      return value;
    }
  }

  return fallback;
}

export const env = {
  appUrl: readOptional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  supabaseUrl: readRequired("SUPABASE_URL"),
  supabaseServiceRoleKey: readRequired("SUPABASE_SERVICE_ROLE_KEY"),
  storageBucket: readOptional("PROFILECORE_STORAGE_BUCKET", "profilecore-documents"),
  maxUploadBytes: Number(readOptional("PROFILECORE_MAX_UPLOAD_BYTES", String(10 * 1024 * 1024))),
  parserUrl: readOptional("PROFILECORE_PARSER_URL", "http://localhost:8000"),
  apiKey: readOptional("PROFILECORE_API_KEY"),
  openAiKey: readOptional("OPENAI_API_KEY"),
  openAiChatModel: readOptional("OPENAI_CHAT_MODEL", "gpt-4.1-mini"),
  anthropicApiKey: readOptional("ANTHROPIC_API_KEY"),
  anthropicChatModel: readOptionalAlias(
    ["ANTHROPIC_CHAT_MODEL", "ANTHROPIC_EXTRACTION_MODEL"],
    "claude-sonnet-4-20250514",
  ),
  mockOpenAi: readOptionalAlias(["PROFILECORE_MOCK_LLM", "PROFILECORE_MOCK_OPENAI"], "true") === "true",
  upstashUrl: readOptional("UPSTASH_REDIS_REST_URL"),
  upstashToken: readOptional("UPSTASH_REDIS_REST_TOKEN"),
} as const;

export function assertConfigured(name: string, value: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
