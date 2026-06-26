-- Remove o domínio de etiquetas (pivô para Elleva Tickets)

drop policy if exists "Users can view profiles in their org" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

drop table if exists public.print_jobs cascade;
drop table if exists public.printers cascade;
drop table if exists public.label_templates cascade;
drop table if exists public.invitations cascade;
drop table if exists public.organizations cascade;

drop function if exists public.my_org_id() cascade;
drop function if exists public.accept_invitation(uuid) cascade;

alter table public.profiles drop column if exists org_id;
alter table public.profiles drop column if exists role;

create policy "Users can view their own profile" on public.profiles for select
  using (id = (select auth.uid()));
create policy "Users can update their own profile" on public.profiles for update
  using (id = (select auth.uid()));
