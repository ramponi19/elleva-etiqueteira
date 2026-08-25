-- ============================================================
-- A7: rate limiting no Postgres (não há estado entre lambdas na Vercel).
-- ============================================================
-- Janela fixa: conta tentativas por "bucket" (ex.: "card:<ip>",
-- "pinfail:<token>:<ip>") dentro de uma janela de N segundos.
-- Usado para conter: teste de cartão roubado no checkout (multa/descredenciamento
-- no MP) e brute-force do PIN de 4 dígitos da portaria.

create table if not exists public.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (bucket, window_start)
);

-- rate_limit(bucket, limite, janela_seg, incrementar)
--   incrementar=true : conta esta tentativa e devolve se AINDA está no limite.
--   incrementar=false: só consulta (usado pra checar "já bloqueado?" sem gastar
--                      uma tentativa — ex.: portaria legítima acerta o PIN e não
--                      pode ser contada como falha).
-- Retorna TRUE = permitido; FALSE = estourou.
create or replace function public.rate_limit(
  p_bucket text, p_limit int, p_window_seconds int, p_increment boolean default true
) returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds);
  c int;
begin
  if p_increment then
    insert into rate_limits(bucket, window_start, count) values (p_bucket, w, 1)
      on conflict (bucket, window_start) do update set count = rate_limits.count + 1
      returning count into c;
  else
    select coalesce(count, 0) into c from rate_limits where bucket = p_bucket and window_start = w;
    c := coalesce(c, 0);
  end if;
  return c <= p_limit;
end
$function$;

-- Só o servidor (service_role) chama — nunca o navegador (senão dá pra zerar/inflar o próprio limite).
revoke execute on function public.rate_limit(text, int, int, boolean) from public, anon, authenticated;
grant  execute on function public.rate_limit(text, int, int, boolean) to service_role;

-- Faxina de janelas antigas (chamada pelo cron diário).
create or replace function public.rate_limit_gc() returns void
language sql security definer set search_path to 'public'
as $function$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$function$;
revoke execute on function public.rate_limit_gc() from public, anon, authenticated;
grant  execute on function public.rate_limit_gc() to service_role;

alter table public.rate_limits enable row level security; -- sem policy: só service_role acessa
