-- Elleva Tickets — schema de domínio

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  category    text not null check (category in ('SHOW','FESTA','ESPORTE','TEATRO','CORPORATIVO','CURSO')),
  icon        text,
  venue       text not null,
  city        text not null,
  starts_at   timestamptz not null,
  status      text not null default 'published' check (status in ('draft','published','sold_out','cancelled')),
  cover_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.ticket_tiers (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  description text,
  price       numeric(10,2) not null check (price >= 0),
  capacity    integer,
  sold        integer not null default 0,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  buyer_name     text not null,
  buyer_email    text not null,
  buyer_cpf      text,
  payment_method text not null default 'pix' check (payment_method in ('pix','card')),
  status         text not null default 'pending' check (status in ('pending','paid','cancelled','refunded')),
  subtotal       numeric(10,2) not null default 0,
  fee            numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  user_id        uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  tier_id     uuid references public.ticket_tiers(id) on delete set null,
  event_id    uuid references public.events(id) on delete set null,
  tier_name   text not null,
  event_title text not null,
  unit_price  numeric(10,2) not null,
  quantity    integer not null check (quantity > 0),
  created_at  timestamptz not null default now()
);

create index idx_ticket_tiers_event_id on public.ticket_tiers(event_id);
create index idx_events_starts_at on public.events(starts_at);
create index idx_events_category on public.events(category);
create index idx_events_status on public.events(status);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_order_items_tier_id on public.order_items(tier_id);
create index idx_order_items_event_id on public.order_items(event_id);
create index idx_orders_user_id on public.orders(user_id);

create trigger set_updated_at_events before update on public.events
  for each row execute function public.set_updated_at();
create trigger set_updated_at_orders before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.ticket_tiers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Public can view published events" on public.events for select
  using (status in ('published','sold_out'));

create policy "Public can view tiers of visible events" on public.ticket_tiers for select
  using (exists (
    select 1 from public.events e
    where e.id = event_id and e.status in ('published','sold_out')
  ));

create policy "Users can view own orders" on public.orders for select
  using (user_id = (select auth.uid()));

create policy "Users can view own order items" on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  ));
