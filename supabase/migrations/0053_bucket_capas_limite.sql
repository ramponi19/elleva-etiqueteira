-- ============================================================
-- A8: limita o bucket de capas (tamanho + tipo).
-- ============================================================
-- `event-covers` é público e estava com file_size_limit e allowed_mime_types
-- NULOS: qualquer conta autenticada subia arquivo de qualquer tipo e tamanho —
-- hospedagem grátis (custo de storage) e, pior, conteúdo alheio sob o domínio
-- da Elleva. A UI já promete "JPEG/GIF/PNG de até 2MB"; damos folga de 5 MB e
-- travamos os tipos. O Storage do Supabase aplica isso server-side em todo
-- upload — é garantia da plataforma, não do app.
--
-- (O outro braço do A8, o CVE do sharp, foi resolvido no upgrade de deps:
-- sharp 0.34.5 -> 0.35.3 via overrides no package.json.)
-- ============================================================
update storage.buckets
set file_size_limit = 5242880,  -- 5 MB
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
where id = 'event-covers';
