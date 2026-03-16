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

export type ProfileLibraryItem = {
  profileId: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  currentCompany: string | null;
  filename: string;
  parsedAt: string;
  lastActivityAt: string;
  lastChattedAt: string | null;
  threadId: string | null;
};

export type DeleteProfileResult = {
  profileId: string;
  documentId: string;
  storageCleanupError: string | null;
};

function assertDocumentAccess(document: UploadedDocumentRow, ownerKey?: string): void {
  if (!ownerKey || document.owner_key === ownerKey) {
    return;
  }

  throw new AppError(404, "document_not_found", "Document not found.");
}

function getCurrentCompany(profile: ParsedProfile): string | null {
  const explicit = profile.person.currentCompany?.trim();
  if (explicit) {
    return explicit;
  }

  const fallback = profile.experience.find((item) => item.company?.trim())?.company?.trim();
  return fallback || null;
}

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

export async function getUploadedDocument(documentId: string, ownerKey?: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("uploaded_document")
    .select("*")
    .eq("id", documentId)
    .single();

  if (error || !data) {
    throw new AppError(404, "document_not_found", "Document not found.");
  }

  const document = data as UploadedDocumentRow;
  assertDocumentAccess(document, ownerKey);

  return document;
}

export async function uploadDocumentBytes(documentId: string, bytes: Uint8Array, mimeType: string, ownerKey?: string) {
  const supabase = getSupabaseAdmin();
  const document = await getUploadedDocument(documentId, ownerKey);

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
  return getUploadedDocument(documentId, ownerKey);
}

export async function createOrReuseExtractionRun(documentId: string, ownerKey?: string) {
  const supabase = getSupabaseAdmin();
  const document = await getUploadedDocument(documentId, ownerKey);

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

export async function getExtractionRunStatus(runId: string, ownerKey?: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("extraction_run")
    .select("*")
    .eq("id", runId)
    .single();

  if (error || !data) {
    throw new AppError(404, "run_not_found", "Extraction run not found.");
  }

  await getUploadedDocument((data as ExtractionRunRow).document_id, ownerKey);

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

export async function getProfileById(profileId: string, ownerKey?: string) {
  const supabase = getSupabaseAdmin();
  const { data: profileRow, error: profileError } = await supabase
    .from("parsed_profile")
    .select("*")
    .eq("id", profileId)
    .single();

  if (profileError || !profileRow) {
    throw new AppError(404, "profile_not_found", "Profile not found.");
  }

  const typedProfile = profileRow as ParsedProfileRow;
  await getUploadedDocument(typedProfile.document_id, ownerKey);

  const { data: sections, error: sectionError } = await supabase
    .from("profile_section")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  if (sectionError) {
    throw new AppError(500, "profile_section_failed", sectionError.message);
  }

  return {
    ...typedProfile,
    canonical_json: assertParsedProfile(typedProfile.canonical_json),
    sections: (sections ?? []) as ProfileSectionRow[],
  } satisfies ProfileRecord;
}

export async function deleteProfileById(profileId: string, ownerKey: string): Promise<DeleteProfileResult> {
  const supabase = getSupabaseAdmin();
  const profile = await getProfileById(profileId, ownerKey);
  const document = await getUploadedDocument(profile.document_id, ownerKey);

  const { error: deleteError } = await supabase
    .from("uploaded_document")
    .delete()
    .eq("id", document.id)
    .eq("owner_key", ownerKey);

  if (deleteError) {
    throw new AppError(500, "profile_delete_failed", deleteError.message);
  }

  const { error: storageCleanupError } = await supabase.storage.from(env.storageBucket).remove([document.storage_path]);

  return {
    profileId: profile.id,
    documentId: document.id,
    storageCleanupError: storageCleanupError?.message ?? null,
  };
}

export async function listProfileLibraryItems(ownerKey: string): Promise<ProfileLibraryItem[]> {
  const supabase = getSupabaseAdmin();
  const { data: documents, error: documentError } = await supabase
    .from("uploaded_document")
    .select("id, owner_key, filename, mime_type, byte_size, storage_path, upload_state, uploaded_at, created_at, updated_at")
    .eq("owner_key", ownerKey)
    .order("updated_at", { ascending: false });

  if (documentError) {
    throw new AppError(500, "document_list_failed", documentError.message);
  }

  const typedDocuments = (documents ?? []) as UploadedDocumentRow[];
  if (typedDocuments.length === 0) {
    return [];
  }

  const documentById = new Map(typedDocuments.map((document) => [document.id, document]));
  const documentIds = typedDocuments.map((document) => document.id);

  const { data: profiles, error: profileError } = await supabase
    .from("parsed_profile")
    .select("id, document_id, extraction_run_id, schema_version, full_name, headline, location, canonical_json, created_at, updated_at")
    .in("document_id", documentIds)
    .order("updated_at", { ascending: false });

  if (profileError) {
    throw new AppError(500, "profile_list_failed", profileError.message);
  }

  const typedProfiles = (profiles ?? []) as ParsedProfileRow[];
  if (typedProfiles.length === 0) {
    return [];
  }

  const profileIds = typedProfiles.map((profile) => profile.id);
  const { data: threads, error: threadError } = await supabase
    .from("chat_thread")
    .select("*")
    .eq("owner_key", ownerKey)
    .in("profile_id", profileIds)
    .order("updated_at", { ascending: false });

  if (threadError) {
    throw new AppError(500, "thread_list_failed", threadError.message);
  }

  const latestThreadByProfile = new Map<string, ChatThreadRow>();
  for (const thread of (threads ?? []) as ChatThreadRow[]) {
    if (!latestThreadByProfile.has(thread.profile_id)) {
      latestThreadByProfile.set(thread.profile_id, thread);
    }
  }

  return typedProfiles
    .map((profile) => {
      const document = documentById.get(profile.document_id);
      if (!document) {
        return null;
      }

      const thread = latestThreadByProfile.get(profile.id) ?? null;
      const lastActivityAt = thread?.updated_at ?? profile.updated_at;

      return {
        profileId: profile.id,
        fullName: profile.full_name,
        headline: profile.headline,
        location: profile.location,
        currentCompany: getCurrentCompany(profile.canonical_json),
        filename: document.filename,
        parsedAt: profile.created_at,
        lastActivityAt,
        lastChattedAt: thread?.updated_at ?? null,
        threadId: thread?.id ?? null,
      } satisfies ProfileLibraryItem;
    })
    .filter((item): item is ProfileLibraryItem => item !== null)
    .sort((left, right) => Date.parse(right.lastActivityAt) - Date.parse(left.lastActivityAt));
}

export async function getLatestChatThreadForProfile(profileId: string, ownerKey: string) {
  await getProfileById(profileId, ownerKey);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chat_thread")
    .select("*")
    .eq("profile_id", profileId)
    .eq("owner_key", ownerKey)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError(500, "thread_lookup_failed", error.message);
  }

  return (data as ChatThreadRow | null) ?? null;
}

export async function getOrCreateChatThread(profileId: string, ownerKey: string, title?: string) {
  const existingThread = await getLatestChatThreadForProfile(profileId, ownerKey);
  if (existingThread) {
    return existingThread;
  }

  const profile = await getProfileById(profileId, ownerKey);
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

export async function getChatThread(threadId: string, ownerKey?: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chat_thread")
    .select("*")
    .eq("id", threadId)
    .single();

  if (error || !data) {
    throw new AppError(404, "thread_not_found", "Chat thread not found.");
  }

  const thread = data as ChatThreadRow;

  if (ownerKey && thread.owner_key !== ownerKey) {
    throw new AppError(404, "thread_not_found", "Chat thread not found.");
  }

  if (ownerKey) {
    await getProfileById(thread.profile_id, ownerKey);
  }

  return thread;
}

export async function listMessages(threadId: string, ownerKey?: string) {
  const supabase = getSupabaseAdmin();
  await getChatThread(threadId, ownerKey);
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

export async function sendMessageToThread(threadId: string, content: string, ownerKey: string) {
  const supabase = getSupabaseAdmin();
  const thread = await getChatThread(threadId, ownerKey);
  const profile = await getProfileById(thread.profile_id, ownerKey);
  const existingMessages = await listMessages(threadId, ownerKey);

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

  const touchedAt = new Date().toISOString();
  const { error: threadTouchError } = await supabase
    .from("chat_thread")
    .update({
      updated_at: touchedAt,
    })
    .eq("id", threadId);

  if (threadTouchError) {
    throw new AppError(500, "thread_touch_failed", threadTouchError.message);
  }

  return {
    thread: {
      ...thread,
      updated_at: touchedAt,
    },
    userMessage,
    assistantMessage,
  };
}
