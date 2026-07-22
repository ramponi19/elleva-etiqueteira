-- Add-ons/produtos (P2): um item vendável que NÃO é ingresso (copo, camiseta,
-- estacionamento). Reaproveita ticket_tiers; is_addon=true não gera QR.
-- Aplicada no remoto em 2026-07-21 (MCP).
alter table public.ticket_tiers add column if not exists is_addon boolean not null default false;
alter table public.order_items add column if not exists is_addon boolean not null default false;
