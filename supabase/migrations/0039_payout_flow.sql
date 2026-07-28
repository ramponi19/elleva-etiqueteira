-- Fluxo de repasse: solicitação (produtor) → processamento (admin) com comprovante.
-- payouts já tinha (producer_id, event_id, amount, status, note, created_at).
alter table public.payouts drop constraint if exists payouts_status_check;

alter table public.payouts
  add column if not exists method text,            -- pix_manual | pix_auto | outro
  add column if not exists reference text,          -- comprovante / txid / nº do recibo
  add column if not exists paid_at timestamptz,     -- quando foi efetivamente pago
  add column if not exists rejected_reason text,    -- motivo se segurado/negado
  add column if not exists requested_at timestamptz not null default now();

alter table public.payouts alter column status set default 'requested';

-- estados: solicitado pelo produtor, pago pela Elleva (com comprovante), ou negado/segurado
alter table public.payouts
  add constraint payouts_status_check check (status in ('requested', 'paid', 'rejected'));

create index if not exists idx_payouts_status on public.payouts(status);
