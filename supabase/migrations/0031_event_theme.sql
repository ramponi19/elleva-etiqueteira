-- Tema da página do evento (P2). null = automático (segue a categoria).
-- Restrito à paleta Cartaz de Show.
-- Aplicada no remoto em 2026-07-21 (MCP).
alter table public.events
  add column if not exists theme text
  constraint events_theme_check check (theme is null or theme in ('sol','cartaz','palco','tinta','papel'));
