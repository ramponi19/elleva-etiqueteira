-- ============================================================
-- Fecha as duas funções de TRIGGER que também respondiam ao público
-- (mesmo defeito da 0048; ficaram de fora porque exigiam uma prova).
-- ============================================================
-- `enforce_service_fee_admin_only` e `prevent_role_escalation` são funções
-- de trigger — chamá-las por /rest/v1/rpc/... só dá erro de contexto, mas
-- estavam listadas no advisor e não há motivo pra ficarem abertas.
--
-- A dúvida era se revogar EXECUTE quebraria os próprios triggers, já que é
-- a sessão do produtor que dispara o UPDATE. NÃO quebra: o Postgres confere
-- EXECUTE na criação do trigger (CREATE TRIGGER), não a cada disparo.
-- Testado em transação revertida antes de aplicar: com o EXECUTE já
-- revogado, `update events ... where producer_id = <produtor>` rodando como
-- `authenticated` continuou passando, com o trigger ativo e a taxa intacta.
--
-- Continua valendo o que a 0048 diz: NÃO tocar em `my_role()` nem em
-- `order_belongs_to_user()` — essas rodam DENTRO das políticas de RLS, como
-- o usuário da vez, e revogar derruba toda consulta.
-- ============================================================

revoke execute on function public.enforce_service_fee_admin_only() from public, anon, authenticated;
revoke execute on function public.prevent_role_escalation() from public, anon, authenticated;
