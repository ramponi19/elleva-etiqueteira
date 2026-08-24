-- ============================================================
-- Fecha o perímetro do banco: funções internas deixam de responder
-- ao público. (Auditoria 2026-08-24 — achados C1, C3 e A1.)
-- ============================================================
-- O Postgres concede EXECUTE a PUBLIC em toda função nova por padrão.
-- Como `anon` e `authenticated` herdam de PUBLIC, e o PostgREST expõe
-- tudo que está no schema `public` em /rest/v1/rpc/<nome>, estas funções
-- estavam atendendo a internet inteira com a chave anônima — que é
-- pública por natureza (vive no bundle do navegador).
--
-- Provado em produção antes desta migration, SEM nenhum login:
--   POST /rpc/reserve_tier_stock    → true   (dava pra esgotar lote e oversell)
--   POST /rpc/admin_overview_totals → {"recebido":165.00,"taxa":15.00,...}
--   POST /rpc/finance_event_totals  → GMV, taxa e saldo de TODOS os produtores
--   POST /rpc/increment_coupon_use  → false  (oráculo de código válido)
--
-- Nada quebra: as 12 chamadas dessas funções no app usam o cliente de
-- serviço (`createServiceClient`), e `service_role` tem EXECUTE explícito
-- — reafirmado abaixo pra esta migration ser auto-suficiente.
--
-- NÃO tocar em `my_role()` nem em `order_belongs_to_user()`: elas são
-- chamadas DENTRO das políticas de RLS e rodam como o usuário da vez.
-- Revogar EXECUTE delas derruba a RLS inteira (permission denied em toda
-- consulta). As duas já estão certas: grant explícito, sem PUBLIC.
--
-- REGRA PARA MIGRATIONS FUTURAS: toda função nova em `public` nasce
-- aberta a PUBLIC. Ao criar uma, revogue e conceda só a quem precisa.
-- ============================================================

-- C1 — estoque de ingressos
revoke execute on function public.reserve_tier_stock(uuid, integer) from public, anon, authenticated;
grant  execute on function public.reserve_tier_stock(uuid, integer) to service_role;

-- A1 — uso de cupom
revoke execute on function public.increment_coupon_use(text) from public, anon, authenticated;
grant  execute on function public.increment_coupon_use(text) to service_role;

-- C3 — agregações financeiras e relatórios (p_producer/p_producers null = plataforma toda)
revoke execute on function public.finance_event_totals(uuid[]) from public, anon, authenticated;
grant  execute on function public.finance_event_totals(uuid[]) to service_role;

revoke execute on function public.finance_producer_totals(uuid[]) from public, anon, authenticated;
grant  execute on function public.finance_producer_totals(uuid[]) to service_role;

revoke execute on function public.admin_overview_totals() from public, anon, authenticated;
grant  execute on function public.admin_overview_totals() to service_role;

revoke execute on function public.producer_sales_daily(uuid, integer) from public, anon, authenticated;
grant  execute on function public.producer_sales_daily(uuid, integer) to service_role;

revoke execute on function public.producer_checkin_report(uuid) from public, anon, authenticated;
grant  execute on function public.producer_checkin_report(uuid) to service_role;
