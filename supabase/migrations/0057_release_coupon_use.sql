-- A-1 (auditoria 2026-09-03): o uso do cupom passa a ser RESERVADO na criação do
-- pedido (increment_coupon_use, que já é atômico) e LIBERADO aqui quando o pedido
-- é cancelado / expira (Pix vencido) / é reembolsado. Antes, o incremento só
-- acontecia no pagamento e o retorno era ignorado — dava pra criar N pedidos
-- pendentes com o mesmo cupom de uso único e pagar todos com desconto.
create or replace function public.release_coupon_use(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update coupons
     set used_count = greatest(0, coalesce(used_count, 0) - 1)
   where code = p_code;
$$;

-- Só o service_role (server) libera; nunca o navegador.
revoke all on function public.release_coupon_use(text) from public, anon, authenticated;
grant execute on function public.release_coupon_use(text) to service_role;
