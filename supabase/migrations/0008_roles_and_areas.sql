-- Papéis de usuário + posse de eventos por produtor

alter table public.profiles add column if not exists role text not null default 'customer'
  check (role in ('customer','producer','admin'));

alter table public.events add column if not exists producer_id uuid references public.profiles(id) on delete set null;
create index if not exists idx_events_producer_id on public.events(producer_id);

create or replace function public.my_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;
revoke execute on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

-- EVENTS
create policy "Admins manage all events" on public.events for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy "Producers manage own events" on public.events for all
  using (producer_id = (select auth.uid()) and public.my_role() = 'producer')
  with check (producer_id = (select auth.uid()) and public.my_role() = 'producer');

-- TICKET TIERS
create policy "Admins manage all tiers" on public.ticket_tiers for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy "Producers manage tiers of own events" on public.ticket_tiers for all
  using (exists (select 1 from public.events e where e.id = event_id and e.producer_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_id and e.producer_id = (select auth.uid())));

-- ORDERS
create policy "Admins view all orders" on public.orders for select
  using (public.my_role() = 'admin');
create policy "Producers view orders of own events" on public.orders for select
  using (exists (
    select 1 from public.order_items oi
    join public.events e on e.id = oi.event_id
    where oi.order_id = orders.id and e.producer_id = (select auth.uid())
  ));

-- ORDER ITEMS
create policy "Admins view all order items" on public.order_items for select
  using (public.my_role() = 'admin');
create policy "Producers view items of own events" on public.order_items for select
  using (exists (select 1 from public.events e where e.id = event_id and e.producer_id = (select auth.uid())));

-- PROFILES
create policy "Admins view all profiles" on public.profiles for select
  using (public.my_role() = 'admin');
