-- ============================================================
-- Elleva — Otimização de RLS e índices (resolve advisors de performance)
--   1. auth.uid()/my_org_id() envoltos em (select ...) → initplan, avaliado 1x
--   2. Políticas FOR ALL de admin divididas em INSERT/UPDATE/DELETE
--      (elimina sobreposição com a policy de SELECT)
--   3. Índices nas foreign keys sem cobertura
-- ============================================================

-- ---------- ORGANIZATIONS ----------
drop policy if exists "Users can view their organization" on public.organizations;
drop policy if exists "Owners can update their organization" on public.organizations;

create policy "Users can view their organization" on public.organizations for select
  using (id = (select public.my_org_id()));
create policy "Owners can update their organization" on public.organizations for update
  using (id = (select public.my_org_id()))
  with check (id = (select public.my_org_id()));

-- ---------- PROFILES ----------
drop policy if exists "Users can view profiles in their org" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can view profiles in their org" on public.profiles for select
  using (org_id = (select public.my_org_id()));
create policy "Users can update their own profile" on public.profiles for update
  using (id = (select auth.uid()));

-- ---------- LABEL TEMPLATES ----------
drop policy if exists "Org members can view templates" on public.label_templates;
drop policy if exists "Admins can manage templates" on public.label_templates;

create policy "Org members can view templates" on public.label_templates for select
  using (org_id = (select public.my_org_id()));
create policy "Admins can insert templates" on public.label_templates for insert
  with check (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));
create policy "Admins can update templates" on public.label_templates for update
  using (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));
create policy "Admins can delete templates" on public.label_templates for delete
  using (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));

-- ---------- PRINTERS ----------
drop policy if exists "Org members can view printers" on public.printers;
drop policy if exists "Admins can manage printers" on public.printers;

create policy "Org members can view printers" on public.printers for select
  using (org_id = (select public.my_org_id()));
create policy "Admins can insert printers" on public.printers for insert
  with check (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));
create policy "Admins can update printers" on public.printers for update
  using (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));
create policy "Admins can delete printers" on public.printers for delete
  using (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));

-- ---------- PRINT JOBS ----------
drop policy if exists "Org members can view print jobs" on public.print_jobs;
drop policy if exists "Org members can create print jobs" on public.print_jobs;
drop policy if exists "Admins can update print jobs" on public.print_jobs;
drop policy if exists "Admins can delete print jobs" on public.print_jobs;

create policy "Org members can view print jobs" on public.print_jobs for select
  using (org_id = (select public.my_org_id()));
create policy "Org members can create print jobs" on public.print_jobs for insert
  with check (org_id = (select public.my_org_id()));
create policy "Admins can update print jobs" on public.print_jobs for update
  using (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));
create policy "Admins can delete print jobs" on public.print_jobs for delete
  using (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));

-- ---------- INVITATIONS ----------
drop policy if exists "Org members can view invitations" on public.invitations;
drop policy if exists "Admins can manage invitations" on public.invitations;

create policy "Org members can view invitations" on public.invitations for select
  using (org_id = (select public.my_org_id()));
create policy "Admins can insert invitations" on public.invitations for insert
  with check (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));
create policy "Admins can update invitations" on public.invitations for update
  using (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));
create policy "Admins can delete invitations" on public.invitations for delete
  using (org_id = (select public.my_org_id()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('owner','admin')));

-- ---------- ÍNDICES NAS FOREIGN KEYS ----------
create index if not exists idx_label_templates_created_by on public.label_templates(created_by);
create index if not exists idx_print_jobs_template_id on public.print_jobs(template_id);
create index if not exists idx_print_jobs_printer_id on public.print_jobs(printer_id);
create index if not exists idx_print_jobs_requested_by on public.print_jobs(requested_by);
create index if not exists idx_invitations_invited_by on public.invitations(invited_by);
