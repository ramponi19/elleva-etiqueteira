-- ============================================================
-- Financeiro nível ERP: antecipação (com taxa %), lançamentos manuais
-- (crédito/débito) e comprovante de repasse em arquivo privado.
-- ============================================================

-- 1) payouts: tipo (normal|antecipação), taxa aplicada, líquido pago, comprovante
alter table public.payouts
  add column if not exists kind text not null default 'normal',
  add column if not exists fee_pct numeric(5,2) not null default 0,
  add column if not exists fee_amount numeric not null default 0,
  add column if not exists net_amount numeric,
  add column if not exists receipt_path text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.payouts drop constraint if exists payouts_kind_check;
alter table public.payouts
  add constraint payouts_kind_check check (kind in ('normal', 'advance'));

-- net_amount = amount - fee_amount (retrocompat: preenche o histórico)
update public.payouts set net_amount = amount - coalesce(fee_amount, 0) where net_amount is null;

-- 2) lançamentos manuais do admin (ajustes, chargeback, multa, acerto)
create table if not exists public.finance_adjustments (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  kind text not null check (kind in ('credit', 'debit')),
  amount numeric not null check (amount > 0),
  reason text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.finance_adjustments enable row level security;

drop policy if exists "Producers view own adjustments" on public.finance_adjustments;
create policy "Producers view own adjustments" on public.finance_adjustments
  for select using (producer_id = (select auth.uid()));

drop policy if exists "Admins manage adjustments" on public.finance_adjustments;
create policy "Admins manage adjustments" on public.finance_adjustments
  for all using (public.my_role() = 'admin');

grant select on public.finance_adjustments to authenticated;
create index if not exists idx_adjust_producer on public.finance_adjustments(producer_id);

-- 3) antecipação por produtor (admin habilita e define a taxa)
alter table public.profiles
  add column if not exists advance_enabled boolean not null default false,
  add column if not exists advance_fee_pct numeric(5,2) not null default 5;

-- 4) bucket PRIVADO de comprovantes de repasse
insert into storage.buckets (id, name, public)
values ('payout-receipts', 'payout-receipts', false)
on conflict (id) do nothing;

drop policy if exists "payout-receipts admin read" on storage.objects;
create policy "payout-receipts admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'payout-receipts' and public.my_role() = 'admin');

drop policy if exists "payout-receipts admin upload" on storage.objects;
create policy "payout-receipts admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payout-receipts' and public.my_role() = 'admin');
