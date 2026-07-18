-- Taxa de serviço explícita por evento (P0 do benchmark Sympla/Byma).
-- Quem define é a Elleva (admin), após a criação do evento — padrão 10%,
-- ajustável por negociação. O produtor nunca escolhe a própria taxa:
-- o trigger força o padrão no INSERT e bloqueia UPDATE de não-admin.
-- auth.uid() IS NULL = service role (actions do servidor) → permitido.

alter table public.events
  add column if not exists service_fee_pct numeric(5,2) not null default 10
  constraint events_service_fee_pct_range check (service_fee_pct >= 0 and service_fee_pct <= 100);

create or replace function public.enforce_service_fee_admin_only()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_admin boolean;
begin
  if auth.uid() is null then
    return new; -- service role
  end if;
  requester_admin := coalesce(
    (select role from public.profiles where id = auth.uid()), ''
  ) = 'admin';
  if tg_op = 'INSERT' then
    if not requester_admin then
      new.service_fee_pct := 10; -- produtor não escolhe a taxa
    end if;
  elsif new.service_fee_pct is distinct from old.service_fee_pct
        and not requester_admin then
    raise exception 'Só a Elleva define a taxa de serviço';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_service_fee_admin_only on public.events;
create trigger trg_service_fee_admin_only
  before insert or update on public.events
  for each row execute function public.enforce_service_fee_admin_only();
