-- M-7 (auditoria 2026-09-03): reconcilia a policy de gestão de eventos com o
-- estado REAL do banco de produção. A 0008 ainda condicionava a gestão ao papel
-- 'producer', que deixou de existir na 0052 (colapsado em 'user'); a policy foi
-- corrigida à mão no banco. Sem versionar isto, recriar o banco do zero (DR /
-- staging novo / reset) deixaria produtores sem criar/editar/ver os próprios
-- eventos (a RLS negaria) — quebra de disponibilidade.
drop policy if exists "Producers manage own events" on public.events;
create policy "Producers manage own events" on public.events
  for all
  using (producer_id = (select auth.uid()))
  with check (producer_id = (select auth.uid()));
