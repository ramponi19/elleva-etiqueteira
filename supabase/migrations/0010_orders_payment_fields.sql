-- Campos de pagamento (Mercado Pago Pix)
alter table public.orders add column if not exists payment_provider text;
alter table public.orders add column if not exists payment_id text;
alter table public.orders add column if not exists pix_qr_base64 text;
alter table public.orders add column if not exists pix_copy_paste text;
alter table public.orders add column if not exists paid_at timestamptz;

create index if not exists idx_orders_payment_id on public.orders(payment_id);
