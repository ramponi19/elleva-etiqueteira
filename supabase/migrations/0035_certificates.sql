-- Certificado de participação (opt-in por evento). Liberado só para
-- ingressos com check-in feito (status 'used'). Modelo definido pelo produtor;
-- nome/evento/data/código são preenchidos pelo sistema.

alter table public.events add column if not exists certificate_enabled boolean not null default false;
alter table public.events add column if not exists certificate_title text;
alter table public.events add column if not exists certificate_body text;
alter table public.events add column if not exists certificate_hours text;
alter table public.events add column if not exists certificate_signer text;

-- código público de validação do certificado (gerado na 1a emissão)
alter table public.tickets add column if not exists certificate_code text;
create unique index if not exists tickets_certificate_code_key
  on public.tickets(certificate_code) where certificate_code is not null;

-- Regrant das colunas de events pro anon/authenticated (esconde só checkin_token).
do $$
declare col text;
begin
  for col in
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'events' and column_name <> 'checkin_token'
  loop
    execute format('grant select (%I) on public.events to anon, authenticated', col);
  end loop;
end $$;
