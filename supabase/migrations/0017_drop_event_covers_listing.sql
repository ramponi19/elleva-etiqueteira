-- Segurança: remove a policy de SELECT ampla do bucket público event-covers.
-- O bucket é público, então as capas continuam acessíveis por URL sem essa
-- policy; ela só permitia enumerar/listar todos os arquivos do bucket.
-- (advisor: public_bucket_allows_listing)
drop policy if exists "event-covers public read" on storage.objects;
