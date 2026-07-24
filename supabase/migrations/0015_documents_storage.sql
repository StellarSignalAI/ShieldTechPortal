-- Platform-wide file/document storage. Beyond captured site photos (0006),
-- everything a user uploads — team-member documents, receipts, work-order
-- photos, proposal/contract PDFs, asset imports — persists here and is tracked
-- in the `attachments` registry so it's queryable and linkable per entity.

-- ── documents bucket ────────────────────────────────────────────────────────
-- Public read (URLs are unguessable; matches site-photos), authenticated write.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "documents: authenticated upload" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );
create policy "documents: authenticated update" on storage.objects
  for update using (
    bucket_id = 'documents'
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );
create policy "documents: authenticated delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );
create policy "documents: public read" on storage.objects
  for select using (bucket_id = 'documents');

-- ── attachments registry ────────────────────────────────────────────────────
create table if not exists public.attachments (
  id          text primary key,
  owner       uuid not null references public.profiles(id) on delete cascade,
  bucket      text not null default 'documents',
  path        text not null,
  name        text,
  mime        text,
  size        bigint,
  url         text,
  entity      text,          -- e.g. 'employee', 'work_order', 'expense', 'proposal'
  entity_id   text,          -- the linked record's id
  shared      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists attachments_entity_idx on public.attachments (entity, entity_id);
create index if not exists attachments_owner_idx  on public.attachments (owner);

alter table public.attachments enable row level security;

-- Shared rows visible to any signed-in staff member; private rows only to owner.
create policy "attachments: read" on public.attachments
  for select using (
    shared = true or owner = auth.uid()
  );
create policy "attachments: insert own" on public.attachments
  for insert with check (owner = auth.uid());
create policy "attachments: update own" on public.attachments
  for update using (owner = auth.uid());
create policy "attachments: delete own" on public.attachments
  for delete using (owner = auth.uid());
