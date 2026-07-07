-- Paridade "Criar Evento" (Sympla): campos adicionais no evento e nos lotes.
-- Tudo aditivo (nullable/default) — não quebra dados nem código existente.
-- Aplicada no remoto em 2026-07-07 (MCP).

alter table public.events
  add column if not exists ends_at timestamptz,
  add column if not exists subcategory text,
  add column if not exists address text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists neighborhood text,
  add column if not exists cep text,
  add column if not exists state text,
  add column if not exists show_on_maps boolean not null default true,
  add column if not exists producer_name text,
  add column if not exists producer_bio text,
  add column if not exists visibility text not null default 'public',
  add column if not exists absorb_fee boolean not null default false,
  add column if not exists ticket_nomenclature text not null default 'Ingresso';

do $$ begin
  alter table public.events
    add constraint events_visibility_check check (visibility in ('public','private'));
exception when duplicate_object then null; end $$;

alter table public.ticket_tiers
  add column if not exists is_free boolean not null default false;
