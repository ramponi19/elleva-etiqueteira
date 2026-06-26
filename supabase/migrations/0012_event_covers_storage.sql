-- Bucket público para capas de eventos
insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

create policy "event-covers public read"
  on storage.objects for select
  using (bucket_id = 'event-covers');

create policy "event-covers authenticated upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'event-covers');

create policy "event-covers owner update"
  on storage.objects for update to authenticated
  using (bucket_id = 'event-covers' and owner = (select auth.uid()));

create policy "event-covers owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'event-covers' and owner = (select auth.uid()));
