-- Receipts pipeline + storage lockdown.
-- Buckets site-photos / documents / receipts are now PRIVATE (public=false,
-- set alongside this migration); clients use signed URLs. The wide-open
-- "documents: public read" policy is replaced with authenticated-only.

-- ── storage policies ──
drop policy if exists "documents: public read" on storage.objects;
create policy "documents: authenticated read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "receipts: authenticated upload" on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );
create policy "receipts: authenticated read" on storage.objects
  for select using (
    bucket_id = 'receipts'
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );
create policy "receipts: staff delete" on storage.objects
  for delete using (
    bucket_id = 'receipts'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );

-- ── receipts inbox ──
-- Anyone signed in (tech / mobile portal / desktop) snaps a receipt into the
-- inbox; the office converts it to a categorized expense in one click.
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references auth.users(id),
  uploader_name text,
  path text not null,                        -- storage path in the receipts bucket
  note text,
  vendor text,
  amount numeric,
  job_ref text,                              -- optional WO/project reference
  status text not null default 'inbox',      -- inbox | converted | dismissed
  expense_category text,
  converted_by uuid references auth.users(id),
  converted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.receipts enable row level security;

create policy "receipts: insert own" on public.receipts
  for insert with check (auth.uid() = uploaded_by);
create policy "receipts: read own or staff" on public.receipts
  for select using (
    auth.uid() = uploaded_by
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
create policy "receipts: staff update" on public.receipts
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
