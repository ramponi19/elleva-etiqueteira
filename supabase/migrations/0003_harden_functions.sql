-- ============================================================
-- Elleva — Hardening de funções (resolve advisors de segurança)
-- ============================================================

-- set_updated_at: fixa search_path e restringe execução (trigger-only)
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- handle_new_user: trigger em auth.users — não deve ser chamável via API
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- my_org_id: necessária para avaliação de RLS pelo usuário autenticado,
-- mas não precisa ser exposta ao anon nem chamável diretamente por anon
revoke execute on function public.my_org_id() from public, anon;
grant execute on function public.my_org_id() to authenticated;

-- accept_invitation: RPC intencional para usuários logados aceitarem convites.
-- Remove acesso anônimo; mantém apenas authenticated (design esperado).
revoke execute on function public.accept_invitation(uuid) from public, anon;
grant execute on function public.accept_invitation(uuid) to authenticated;
