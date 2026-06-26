-- Allowlist de admins: e-mails aqui viram 'admin' automaticamente no signup
create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
create policy "Admins view allowlist" on public.app_admins for select
  using (public.my_role() = 'admin');

insert into public.app_admins (email) values
  ('matheussrosa@live.com'),
  ('lucas.souza19@hotmail.com')
  on conflict (email) do nothing;

-- handle_new_user define role com base na allowlist
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    case when exists (select 1 from public.app_admins a where a.email = new.email)
      then 'admin' else 'customer' end
  );
  return new;
end;
$$;
