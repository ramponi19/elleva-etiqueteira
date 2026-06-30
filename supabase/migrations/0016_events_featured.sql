alter table public.events add column if not exists is_featured boolean not null default false;
alter table public.events add column if not exists featured_order int not null default 0;
create index if not exists idx_events_featured on public.events (is_featured, featured_order);
