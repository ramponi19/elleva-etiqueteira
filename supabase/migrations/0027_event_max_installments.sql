-- Nº máximo de parcelas oferecido no cartão (padrão 12). Quem define é a
-- Elleva (admin) por evento, como a taxa de serviço. Os juros das parcelas
-- são do Mercado Pago (modelo "com juros" pro comprador, padrão).
-- Aplicada no remoto em 2026-07-21 (MCP).
alter table public.events
  add column if not exists max_installments smallint not null default 12
  constraint events_max_installments_range check (max_installments >= 1 and max_installments <= 12);
