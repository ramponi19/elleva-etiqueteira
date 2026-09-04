-- Decisão de produto (2026-09-04): o login diz "não possui cadastro" (com link
-- pra cadastrar) em vez do erro genérico. Isso revela se um e-mail tem conta
-- (enumeração), então: só o servidor (service_role) chama esta função, e a
-- server action que a usa é rate-limitada por IP. O profiles não guarda e-mail,
-- por isso a consulta vai em auth.users via security definer.
create or replace function public.email_exists(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from auth.users
     where lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.email_exists(text) from public, anon, authenticated;
grant execute on function public.email_exists(text) to service_role;
