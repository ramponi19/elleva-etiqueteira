-- Re-concede SELECT em TODAS as colunas atuais de events (menos checkin_token)
-- pra anon/authenticated. Colunas adicionadas depois do grant coluna-a-coluna
-- (max_installments, tracking_*, theme) ficaram sem permissão -> getEvent caía
-- no MOCK pra deslogado. Este bloco pega o estado atual e conserta.
-- IMPORTANTE: ao adicionar coluna nova em events, rodar este bloco de novo.
-- Aplicada no remoto em 2026-07-21 (MCP).
do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ')
    into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'events'
    and column_name <> 'checkin_token';

  execute 'revoke select on public.events from anon, authenticated';
  execute format('grant select (%s) on public.events to anon, authenticated', cols);
end $$;
