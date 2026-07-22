-- BUG CRÍTICO (desde a 0008): as policies de admin/produtor (FOR ALL) avaliam
-- my_role() também em SELECTs anônimos; sem EXECUTE pro anon, TODA leitura
-- pública do banco falhava (42501 permission denied) e o site caía no
-- fallback mock — deslogado via eventos falsos, e nenhuma compra real era
-- possível (tier ids do mock não existem no banco).
-- my_role() só lê o papel do próprio caller (auth.uid() de anon é null ->
-- retorna null), então conceder EXECUTE ao anon é seguro.

grant execute on function public.my_role() to anon;
