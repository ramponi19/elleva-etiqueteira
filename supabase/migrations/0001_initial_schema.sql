-- ============================================================
-- Elleva — Schema inicial
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  plan        text not null default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  subscription_status     text default 'trialing',
  trial_ends_at           timestamptz default (now() + interval '14 days'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid references public.organizations(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- LABEL TEMPLATES
-- ============================================================
create table public.label_templates (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  created_by  uuid references public.profiles(id) on delete set null,
  name        text not null,
  description text,
  width_mm    numeric(8,2) not null,
  height_mm   numeric(8,2) not null,
  format      text not null default 'zpl' check (format in ('zpl', 'pdf', 'png')),
  content     text not null,           -- ZPL template or JSON layout
  variables   jsonb not null default '[]',  -- [{name, type, required, default}]
  version     integer not null default 1,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PRINTERS
-- ============================================================
create table public.printers (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  model       text,
  serial_number text,
  ip_address  inet,
  dpi         integer default 203,
  status      text not null default 'offline' check (status in ('online', 'offline', 'error', 'busy')),
  last_seen_at timestamptz,
  location    text,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PRINT JOBS
-- ============================================================
create table public.print_jobs (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  template_id     uuid not null references public.label_templates(id) on delete restrict,
  printer_id      uuid references public.printers(id) on delete set null,
  requested_by    uuid references public.profiles(id) on delete set null,
  status          text not null default 'queued'
                    check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  quantity        integer not null default 1 check (quantity > 0),
  variables_data  jsonb not null default '{}',
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_organizations
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_label_templates
  before update on public.label_templates
  for each row execute function public.set_updated_at();

create trigger set_updated_at_printers
  before update on public.printers
  for each row execute function public.set_updated_at();

create trigger set_updated_at_print_jobs
  before update on public.print_jobs
  for each row execute function public.set_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_profiles_org_id on public.profiles(org_id);
create index idx_label_templates_org_id on public.label_templates(org_id);
create index idx_printers_org_id on public.printers(org_id);
create index idx_print_jobs_org_id on public.print_jobs(org_id);
create index idx_print_jobs_status on public.print_jobs(status);
create index idx_print_jobs_created_at on public.print_jobs(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.label_templates enable row level security;
alter table public.printers enable row level security;
alter table public.print_jobs enable row level security;

-- Helper: get current user's org_id
create or replace function public.my_org_id()
returns uuid language sql stable security definer
set search_path = '' as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- organizations
create policy "Users can view their organization"
  on public.organizations for select
  using (id = public.my_org_id());

create policy "Owners can update their organization"
  on public.organizations for update
  using (id = public.my_org_id())
  with check (id = public.my_org_id());

-- profiles
create policy "Users can view profiles in their org"
  on public.profiles for select
  using (org_id = public.my_org_id());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- label_templates
create policy "Org members can view templates"
  on public.label_templates for select
  using (org_id = public.my_org_id());

create policy "Admins can manage templates"
  on public.label_templates for all
  using (
    org_id = public.my_org_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- printers
create policy "Org members can view printers"
  on public.printers for select
  using (org_id = public.my_org_id());

create policy "Admins can manage printers"
  on public.printers for all
  using (
    org_id = public.my_org_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- print_jobs
create policy "Org members can view print jobs"
  on public.print_jobs for select
  using (org_id = public.my_org_id());

create policy "Org members can create print jobs"
  on public.print_jobs for insert
  with check (org_id = public.my_org_id());

create policy "Admins can update print jobs"
  on public.print_jobs for update
  using (
    org_id = public.my_org_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

create policy "Admins can delete print jobs"
  on public.print_jobs for delete
  using (
    org_id = public.my_org_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN UP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
