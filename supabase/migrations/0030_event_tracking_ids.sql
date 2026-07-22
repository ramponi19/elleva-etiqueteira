-- Pixel/Analytics por evento (marketing do produtor). Disparam só com
-- consentimento de cookies (LGPD). Opcionais.
-- Aplicada no remoto em 2026-07-21 (MCP).
alter table public.events
  add column if not exists tracking_meta_pixel text,
  add column if not exists tracking_ga text;
