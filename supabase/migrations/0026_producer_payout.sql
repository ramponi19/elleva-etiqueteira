-- Conta de repasse do produtor + histórico de repasses (extrato) — espelha a
-- área Financeira da Sympla. Aditivo; RLS: produtor vê o próprio, admin gere.
-- Aplicada no remoto em 2026-07-21 (MCP).

alter table public.profiles
  add column if not exists payout_pix_key text,
  add column if not exists payout_pix_type text,   -- cpf | cnpj | email | phone | random
  add column if not exists payout_holder text,      -- titular da conta
  add column if not exists payout_doc text;          -- CPF/CNPJ do titular

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  amount numeric not null check (amount >= 0),
  status text not null default 'paid' check (status in ('pending', 'paid')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.payouts enable row level security;

drop policy if exists "Producers view own payouts" on public.payouts;
create policy "Producers view own payouts" on public.payouts
  for select using (producer_id = (select auth.uid()));

drop policy if exists "Admins manage payouts" on public.payouts;
create policy "Admins manage payouts" on public.payouts
  for all using (public.my_role() = 'admin');

grant select on public.payouts to authenticated;
create index if not exists idx_payouts_producer on public.payouts(producer_id);
