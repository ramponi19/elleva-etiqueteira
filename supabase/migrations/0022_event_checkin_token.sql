-- Token de check-in por evento: permite compartilhar um link de validação
-- com a equipe de portaria, sem exigir conta. Revogável (basta regenerar).
-- Aplicada no remoto em 2026-07-07 (MCP).

alter table public.events
  add column if not exists checkin_token text;

update public.events
  set checkin_token = replace(gen_random_uuid()::text, '-', '')
  where checkin_token is null;

alter table public.events
  alter column checkin_token set default replace(gen_random_uuid()::text, '-', '');

create unique index if not exists idx_events_checkin_token
  on public.events(checkin_token);

-- Segredo: só service_role lê o token (senão vazaria via anon key).
revoke select (checkin_token) on public.events from anon, authenticated;
