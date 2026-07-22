-- Transferência de ingresso (feature Sympla/Byma). O ingresso transferido
-- some da conta do comprador original e aparece pra quem tem o e-mail destino
-- (mesmo sem conta ainda — vê ao logar com esse e-mail). O código é rotacionado
-- na transferência, então um print do QR antigo não vale mais.
-- Aplicada no remoto em 2026-07-21 (MCP).
alter table public.tickets
  add column if not exists transfer_email text,
  add column if not exists transferred boolean not null default false;

drop policy if exists "Users view own tickets" on public.tickets;
create policy "Users view own tickets" on public.tickets for select
using (
  (transferred is not true and exists (
    select 1 from public.orders o
    where o.id = tickets.order_id and o.user_id = (select auth.uid())
  ))
  or lower(transfer_email) = lower((select auth.jwt() ->> 'email'))
);
