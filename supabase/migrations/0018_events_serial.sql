-- Nº de série do cartaz/ingresso (spec Nível 3 §5.2/§6):
-- sequencial simples exposto como "Nº 0042" na arte do evento.
alter table public.events add column if not exists serial serial;

comment on column public.events.serial is
  'Sequencial usado como número de série visual (Nº 0042) no cartaz, ingresso e OG image.';
