-- Cupom escopado a um evento (criado pelo produtor). event_id null = cupom
-- global da Elleva (admin), como hoje. producer_id registra quem criou.
-- Aplicada no remoto em 2026-07-21 (MCP).
alter table public.coupons
  add column if not exists event_id uuid references public.events(id) on delete cascade,
  add column if not exists producer_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_coupons_producer on public.coupons(producer_id);
