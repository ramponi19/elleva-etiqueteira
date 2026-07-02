-- Ingressos individuais (1 por unidade comprada)
create table public.tickets (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  event_id    uuid references public.events(id) on delete set null,
  code        text not null unique,
  event_title text not null,
  tier_name   text not null,
  status      text not null default 'valid' check (status in ('valid','used','cancelled')),
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_tickets_order_id on public.tickets(order_id);
create index idx_tickets_event_id on public.tickets(event_id);
create index idx_tickets_code on public.tickets(code);

alter table public.tickets enable row level security;

-- Dono do pedido vê seus ingressos
create policy "Users view own tickets" on public.tickets for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  ));

-- Admin vê todos
create policy "Admins view all tickets" on public.tickets for select
  using (public.my_role() = 'admin');

-- Produtor vê ingressos dos próprios eventos
create policy "Producers view tickets of own events" on public.tickets for select
  using (exists (
    select 1 from public.events e
    where e.id = event_id and e.producer_id = (select auth.uid())
  ));
