-- Site photo storage: real captured images from the tech/mobile cameras.

insert into storage.buckets (id, name, public)
values ('site-photos', 'site-photos', true)
on conflict (id) do nothing;

create policy "photos: authenticated upload" on storage.objects
  for insert with check (
    bucket_id = 'site-photos'
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );
create policy "photos: authenticated update" on storage.objects
  for update using (
    bucket_id = 'site-photos'
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );
create policy "photos: public read" on storage.objects
  for select using (bucket_id = 'site-photos');
