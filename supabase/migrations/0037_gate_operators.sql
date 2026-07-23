-- Operadores de portaria: o produtor cadastra responsáveis (nome + CPF) e cada
-- um recebe um PIN. Na portaria, o operador digita o PIN e já entra identificado
-- (identidade travada no cadastro; não dá pra digitar nome falso).

create table if not exists public.gate_operators (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  doc text not null,               -- CPF (só dígitos)
  pin text not null,               -- código curto de acesso
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (producer_id, pin)
);
create index if not exists gate_operators_producer_idx on public.gate_operators(producer_id);

alter table public.gate_operators enable row level security;

drop policy if exists "Producers manage own gate operators" on public.gate_operators;
create policy "Producers manage own gate operators" on public.gate_operators
  for all using (producer_id = (select auth.uid())) with check (producer_id = (select auth.uid()));

drop policy if exists "Admins manage all gate operators" on public.gate_operators;
create policy "Admins manage all gate operators" on public.gate_operators
  for all using (my_role() = 'admin') with check (my_role() = 'admin');

grant select, insert, update, delete on public.gate_operators to authenticated;
-- o resolve do PIN na portaria (anônimo) roda pelo service client (bypassa RLS).
