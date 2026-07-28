-- 1) Uma solicitação ABERTA por produtor e por tipo. Sem isso, dois cliques
-- simultâneos (ou chamada direta da action) comprometiam o MESMO saldo duas
-- vezes e o admin pagava em duplicidade.
create unique index if not exists payouts_uma_aberta_por_tipo
  on public.payouts(producer_id, kind)
  where status = 'requested';

-- 2) Quem SOLICITOU × quem PROCESSOU (antes o admin sobrescrevia created_by e
-- se perdia o rastro de quem pediu o dinheiro).
alter table public.payouts
  add column if not exists processed_by uuid references public.profiles(id) on delete set null;

-- 3) Lançamento manual não pode ser apagado sem rastro (um débito de chargeback
-- podia ser deletado e o saldo voltava, sem nenhuma linha no extrato).
alter table public.finance_adjustments
  add column if not exists reversed_at timestamptz,
  add column if not exists reversed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reversed_reason text;
