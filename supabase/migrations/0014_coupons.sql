create table public.coupons (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  discount_type  text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  max_uses       integer,
  used_count     integer not null default 0,
  active         boolean not null default true,
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);
alter table public.coupons enable row level security;
create policy "Admins manage coupons" on public.coupons for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount numeric(10,2) not null default 0;
