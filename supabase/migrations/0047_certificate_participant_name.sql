-- O certificado saía sempre com o nome do COMPRADOR: errado em compra
-- corporativa (10 inscrições no nome do financeiro) e em ingresso transferido
-- (o participante recebia um documento com o nome de outra pessoa).
-- Agora o nome do participante é gravado por ingresso, no ato da emissão.
alter table public.tickets
  add column if not exists certificate_name text;
