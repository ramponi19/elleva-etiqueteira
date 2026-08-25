-- ============================================================
-- F3: meia-entrada de verdade (era só um texto "· meia R$X/2" no checkout).
-- ============================================================
-- Um lote pode ser marcado como meia-entrada: vira um ingresso próprio,
-- vendável, com preço e cota (capacity) definidos pelo produtor — e sinalizado
-- na portaria como "levar documento". A Lei 12.933/2013 + Decreto 8.537/2015
-- exigem meia com cota de 40% e comprovação; a cota é a capacidade do lote de
-- meia (o form orienta), a comprovação é o documento conferido na entrada.
alter table public.ticket_tiers add column if not exists is_half boolean not null default false;

-- Só o servidor grava tiers (via createEvent/updateEvent com o cliente do
-- usuário — o grant por coluna da migration 0050 já cobre as colunas do form).
-- Reconcede a nova coluna no mesmo espírito das outras editáveis pelo produtor.
grant insert (is_half), update (is_half) on public.ticket_tiers to authenticated;
