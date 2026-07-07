-- Fase C (spec 8.4 + §11):
-- 1) WhatsApp do comprador no pedido (entrega do ingresso; API do WhatsApp
--    vem em fase posterior — por ora fica registrado no pedido).
alter table public.orders add column if not exists buyer_whatsapp text;

-- 2) Escassez realtime: o ticker da página de evento assina mudanças de
--    ticket_tiers (sold/capacity) via postgres_changes.
do $$
begin
  alter publication supabase_realtime add table public.ticket_tiers;
exception
  when duplicate_object then null;
end $$;
