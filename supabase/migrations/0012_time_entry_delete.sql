-- Let technicians delete their own time entries while they are still editable
-- (draft / submitted / rejected). Approved, synced, and paid entries stay locked
-- — the portal owns those. Staff/Admin can delete any entry.

drop policy if exists "time: own delete while editable" on public.time_entries;
create policy "time: own delete while editable" on public.time_entries
  for delete using (
    tech_id = auth.uid() and status in ('draft','submitted','rejected')
  );

drop policy if exists "time: staff delete" on public.time_entries;
create policy "time: staff delete" on public.time_entries
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
