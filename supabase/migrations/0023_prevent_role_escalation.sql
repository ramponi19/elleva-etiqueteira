-- Fecha a brecha: a policy de UPDATE de profiles não tem WITH CHECK, então um
-- usuário autenticado poderia se auto-promover a admin via REST. O trigger
-- bloqueia conceder 'admin' quando quem executa é um usuário comum.
-- auth.uid() IS NULL = service role (actions do admin) → permitido.
-- customer -> producer segue liberado (fluxo "Criar evento").
-- Aplicada no remoto em 2026-07-15 (MCP).

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and new.role = 'admin' then
    if auth.uid() is not null and coalesce(
         (select role from public.profiles where id = auth.uid()), ''
       ) <> 'admin' then
      raise exception 'Sem permissão para conceder papel admin';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update of role on public.profiles
  for each row execute function public.prevent_role_escalation();
