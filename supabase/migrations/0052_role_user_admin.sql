-- ============================================================
-- Colapsa profiles.role: customer|producer|admin  →  user|admin
-- (Fim do legado da conta única — decisão de 2026-08-25.)
-- ============================================================
-- customer e producer já eram tratados IDÊNTICOS em todo o código desde a
-- conta única (commit 823eb95). Este passo torna o dado igual à intenção:
-- toda conta que não é a Elleva é `user` (compra E organiza).
--
-- ORDEM obrigatória (o deploy do código que aceita `user` foi ANTES desta
-- migration): sem isso, o código antigo em produção entraria em loop de
-- redirect ao ver um papel fora da lista antiga.
--
-- O CHECK precisa cair ANTES do UPDATE (senão o novo valor viola o antigo),
-- e o novo CHECK entra DEPOIS do UPDATE (senão os dados antigos o violam).
-- ============================================================

alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles set role = 'user' where role in ('customer', 'producer');

alter table public.profiles alter column role set default 'user';

alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin'));

-- Novo usuário nasce `user` (ou `admin` se estiver na allowlist app_admins).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    case when exists (select 1 from public.app_admins a where a.email = new.email)
      then 'admin' else 'user' end
  );
  return new;
end;
$function$;
