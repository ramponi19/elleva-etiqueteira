-- Admin precisa poder remover/substituir um comprovante anexado por engano.
drop policy if exists "payout-receipts admin delete" on storage.objects;
create policy "payout-receipts admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payout-receipts' and public.my_role() = 'admin');

drop policy if exists "payout-receipts admin update" on storage.objects;
create policy "payout-receipts admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'payout-receipts' and public.my_role() = 'admin');
