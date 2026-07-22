-- Assentos marcados (opt-in por evento). Mapa de setores/fileiras/assentos.
-- Um assento aponta pra um lote (preço). Reserva atômica no pedido.

alter table public.events add column if not exists has_seating boolean not null default false;

create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  tier_id uuid references public.ticket_tiers(id) on delete set null,
  sector text not null default '',
  row_label text not null,
  seat_num int not null,
  label text not null,          -- rótulo exibido, ex. "A12"
  pos_row int not null default 0,
  pos_col int not null default 0,
  status text not null default 'available' check (status in ('available','held','sold')),
  order_id uuid references public.orders(id) on delete set null,
  held_until timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, label)
);
create index if not exists seats_event_idx on public.seats(event_id);
create index if not exists seats_order_idx on public.seats(order_id);

alter table public.order_items add column if not exists seat_id uuid references public.seats(id) on delete set null;
alter table public.tickets add column if not exists seat_label text;

-- RLS: espelha ticket_tiers (público lê de evento visível; produtor dono gere; admin tudo)
alter table public.seats enable row level security;

drop policy if exists "Public can view seats of visible events" on public.seats;
create policy "Public can view seats of visible events" on public.seats
  for select using (exists (
    select 1 from public.events e
    where e.id = seats.event_id and e.status = any (array['published','sold_out'])
  ));

drop policy if exists "Producers manage seats of own events" on public.seats;
create policy "Producers manage seats of own events" on public.seats
  for all using (exists (
    select 1 from public.events e
    where e.id = seats.event_id and e.producer_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.events e
    where e.id = seats.event_id and e.producer_id = (select auth.uid())
  ));

drop policy if exists "Admins manage all seats" on public.seats;
create policy "Admins manage all seats" on public.seats
  for all using (my_role() = 'admin') with check (my_role() = 'admin');

grant select on public.seats to anon, authenticated;
grant insert, update, delete on public.seats to authenticated;

-- Regrant das colunas de events pro anon/authenticated (esconde só checkin_token).
-- Necessário sempre que uma coluna nova entra em events (has_seating).
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
