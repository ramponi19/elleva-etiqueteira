-- A-2 (auditoria 2026-09-03): torna o pós-pagamento REENTRANTE. Antes, se um
-- efeito falhava depois do flip pending->paid (reserva de estoque, geração de
-- ingressos), o pedido ficava 'paid' sem ingresso e um retry curto-circuitava no
-- gate — comprador pagava e não recebia nada, sem recuperação automática.
-- Este flag marca que o estoque já foi reservado para o pedido, para que o
-- fulfillOrder possa ser reexecutado (por webhook repetido ou pelo cron de
-- recuperação) sem decrementar o estoque duas vezes.
alter table public.orders
  add column if not exists stock_reserved boolean not null default false;
