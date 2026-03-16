import "server-only";

import { assertParsedProfile, type ParsedProfile } from "@profilecore/profile-schema";

import { AppError } from "./errors";
import { env } from "./env";
import { generateChatReply } from "./openai";
import { getSupabaseAdmin } from "./supabase";

type UploadedDocumentRow = {
  id: string;
  owner_key: string;
  filename: string;
  mime_type: string;
  byte_size: number;
  storage_path: string;
  upload_state: "pending" | "uploaded" | "failed";
  uploaded_at: string | null;
  created_at: string;
  updated_at: string;
};

type ExtractionRunRow = {
  id: string;
  document_id: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  retry_count: number;
  parser_version: string | null;
  model_name: string | null;
  worker_name: string | null;
  error_code: string | null;
  error_message: string | null;
  claimed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

type ParsedProfileRow = {
  id: string;
  document_id: string;
  extraction_run_id: string;
  schema_version: string;
  full_name: string;
  headline: string | null;
  location: string | null;
  canonical_json: ParsedProfile;
  created_at: string;
  updated_at: string;
};

type ProfileSectionRow = {
  id: string;
  profile_id: string;
  section_name: "overview" | "experience" | "education" | "skills";
  sort_order: number;
  payload: Record<string, unknown>;
};

type ChatThreadRow = {
  id: string;
  profile_id: string;
  owner_key: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ProfileRecord = ParsedProfileRow & {
  canonical_json: ParsedProfile;
  sections: ProfileSectionRow[];
};

export async function createUploadedDocument(params: {
  documentId: string;
  ownerKey: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  storagePath: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("uploaded_document")
    .insert({
      id: params.documentId,
      owner_key: params.ownerKey,
      filename: params.filename,
      mime_type: params.mimeType,
      byte_size: params.byteSize,
      storage_path: params.storagePath,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError(500, "document_create_failed", error?.message ?? "Unable to create document record.");
  }

  return data as UploadedDocumentRow;
}

export async function getUploadedDocument(documentId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("uploaded_document")
    .select("*")
    .eq("id", documentId)
    .single();

  if (error || !data) {
    throw new AppError(404, "document_not_found", "Document not found.");
  }

  return data as UploadedDocumentRow;
}

export async function uploadDocumentBytes(documentId: string, bytes: Uint8Array, mimeType: string) {
  const supabase = getSupabaseAdmin();
  const document = await getUploadedDocument(documentId);

  const { error: uploadError } = await supabase.storage.from(env.storageBucket).upload(document.storage_path, bytes, {
    contentType: mimeType,
    upsert: true,
  });

  if (uploadError) {
    await supabase
      .from("uploaded_document")
      .update({
        upload_state: "failed",
        last_error_code: "upload_failed",
        last_error_message: uploadError.message,
      })
      .eq("id", documentId);

    throw new AppError(500, "upload_failed", uploadError.message);
  }

  const { error: updateError } = await supabase
    .from("uploaded_document")
    .update({
      upload_state: "uploaded",
      uploaded_at: new Date().toISOString(),
      last_error_code: null,
      last_error_message: null,
    })
    .eq("id", documentId);

  if (updateError) {
    throw new AppError(500, "upload_state_failed", updateError.message);
  }

  return getUploadedDocument(documentId);
}

export async function createOrReuseExtractionRun(documentId: string) {
  const supabase = getSupabaseAdmin();
  const document = await getUploadedDocument(documentId);

  if (document.upload_state !== "uploaded") {
    throw new AppError(409, "upload_incomplete", "Upload has not completed.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("extraction_run")
    .select("*")
    .eq("document_id", documentId)
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new AppError(500, "run_lookup_failed", existingError.message);
  }

  if (existing) {
    return existing as ExtractionRunRow;
  }

  const { data, error } = await supabase
    .from("extraction_run")
    .insert({
      document_id: documentId,
      status: "queued",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError(500, "run_create_failed", error?.message ?? "Unable to create extraction run.");
  }

  return data as ExtractionRunRow;
}

export async function getExtractionRunStatus(runId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("extraction_run")
    .select("*")
    .eq("id", runId)
    .single();

  if (error || !data) {
    throw new AppError(404, "run_not_found", "Extraction run not found.");
  }

  const response: {
    run: ExtractionRunRow;
    profileId: string | null;
  } = {
    run: data as ExtractionRunRow,
    profileId: null,
  };

  if (data.status === "succeeded") {
    const { data: profile } = await supabase
      .from("parsed_profile")
      .select("id")
      .eq("extraction_run_id", runId)
      .maybeSingle();

    response.profileId = (profile as { id: string } | null)?.id ?? null;
  }

  return response;
}

export async function getProfileById(profileId: string) {
  const supabase = getSupabaseAdmin();
  const { data: profileRow, error: profileError } = await supabase
    .from("parsed_profile")
    .select("*")
    .eq("id", profileId)
    .single();

  if (profileError || !profileRow) {
    throw new AppError(404, "profile_not_found", "Profile not found.");
  }

  const { data: sections, error: sectionError } = await supabase
    .from("profile_section")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  if (sectionError) {
    throw new AppError(500, "profile_section_failed", sectionError.message);
  }

  const typedProfile = profileRow as ParsedProfileRow;

  return {
    ...typedProfile,
    canonical_json: assertParsedProfile(typedProfile.canonical_json),
    sections: (sections ?? []) as ProfileSectionRow[],
  } satisfies ProfileRecord;
}

export async function createChatThread(profileId: string, ownerKey: string, title?: string) {
  const profile = await getProfileById(profileId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chat_thread")
    .insert({
      profile_id: profileId,
      owner_key: ownerKey,
      title: title ?? `Conversation with ${profile.full_name}`,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError(500, "thread_create_failed", error?.message ?? "Unable to create thread.");
  }

  return data as ChatThreadRow;
}

export async function getChatThread(threadId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chat_thread")
    .select("*")
    .eq("id", threadId)
    .single();

  if (error || !data) {
    throw new AppError(404, "thread_not_found", "Chat thread not found.");
  }

  return data as ChatThreadRow;
}

export async function listMessages(threadId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("message")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError(500, "message_list_failed", error.message);
  }

  return (data ?? []) as MessageRow[];
}

export async function sendMessageToThread(threadId: string, content: string) {
  const supabase = getSupabaseAdmin();
  const thread = await getChatThread(threadId);
  const profile = await getProfileById(thread.profile_id);
  const existingMessages = await listMessages(threadId);

  const { data: userMessage, error: userError } = await supabase
    .from("message")
    .insert({
      thread_id: threadId,
      role: "user",
      content,
      metadata: {},
    })
    .select("*")
    .single();

  if (userError || !userMessage) {
    throw new AppError(500, "user_message_failed", userError?.message ?? "Unable to save user message.");
  }

  const reply = await generateChatReply(
    profile.canonical_json,
    existingMessages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      })),
    content,
  );

  const { data: assistantMessage, error: assistantError } = await supabase
    .from("message")
    .insert({
      thread_id: threadId,
      role: "assistant",
      content: reply.content,
      model_name: reply.model,
      metadata: {
        profileId: profile.id,
      },
    })
    .select("*")
    .single();

  if (assistantError || !assistantMessage) {
    throw new AppError(500, "assistant_message_failed", assistantError?.message ?? "Unable to save assistant message.");
  }

  return {
    thread,
    userMessage,
    assistantMessage,
  };
}
