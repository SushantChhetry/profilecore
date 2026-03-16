create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.uploaded_document (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null default 'anonymous',
  filename text not null,
  mime_type text not null,
  byte_size integer not null check (byte_size > 0),
  source_kind text not null default 'linkedin_pdf',
  storage_path text not null unique,
  upload_state text not null default 'pending' check (upload_state in ('pending', 'uploaded', 'failed')),
  uploaded_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_uploaded_document_updated_at
before update on public.uploaded_document
for each row
execute function public.set_updated_at();

create table if not exists public.extraction_run (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.uploaded_document(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'succeeded', 'failed')),
  retry_count integer not null default 0,
  parser_version text,
  model_name text,
  worker_name text,
  error_code text,
  error_message text,
  claimed_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_extraction_run_updated_at
before update on public.extraction_run
for each row
execute function public.set_updated_at();

create unique index if not exists extraction_run_active_document_idx
on public.extraction_run (document_id)
where status in ('queued', 'processing');

create table if not exists public.parsed_profile (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.uploaded_document(id) on delete cascade,
  extraction_run_id uuid not null unique references public.extraction_run(id) on delete cascade,
  schema_version text not null,
  full_name text not null,
  headline text,
  location text,
  canonical_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_parsed_profile_updated_at
before update on public.parsed_profile
for each row
execute function public.set_updated_at();

create table if not exists public.profile_section (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.parsed_profile(id) on delete cascade,
  section_name text not null check (section_name in ('overview', 'experience', 'education', 'skills')),
  sort_order integer not null default 0,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, section_name, sort_order)
);

create table if not exists public.chat_thread (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.parsed_profile(id) on delete cascade,
  owner_key text not null default 'anonymous',
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_chat_thread_updated_at
before update on public.chat_thread
for each row
execute function public.set_updated_at();

create table if not exists public.message (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_thread(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  model_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profilecore-documents', 'profilecore-documents', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.claim_extraction_run(worker_name text default 'parser-worker')
returns setof public.extraction_run
language plpgsql
as $$
declare
  claimed public.extraction_run;
begin
  with candidate as (
    select id
    from public.extraction_run
    where status = 'queued'
    order by created_at asc
    for update skip locked
    limit 1
  )
  update public.extraction_run run
  set status = 'processing',
      worker_name = claim_extraction_run.worker_name,
      claimed_at = timezone('utc', now()),
      started_at = coalesce(run.started_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
  where run.id in (select id from candidate)
  returning run.* into claimed;

  if claimed.id is not null then
    return next claimed;
  end if;
  return;
end;
$$;

