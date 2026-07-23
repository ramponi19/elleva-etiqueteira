-- Reserva/libera estoque de lote de forma ATÔMICA (evita oversell e lost-update).
-- qty positivo reserva (respeitando capacity); qty negativo libera.
create or replace function public.reserve_tier_stock(p_tier_id uuid, p_qty int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare updated int;
begin
  update ticket_tiers
     set sold = coalesce(sold, 0) + p_qty
   where id = p_tier_id
     and (capacity is null or coalesce(sold, 0) + p_qty <= capacity);
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

-- Incremento ATÔMICO de uso de cupom, respeitando max_uses. Retorna true se contou.
create or replace function public.increment_coupon_use(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare updated int;
begin
  update coupons
     set used_count = coalesce(used_count, 0) + 1
   where code = p_code
     and (max_uses is null or coalesce(used_count, 0) < max_uses);
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

revoke all on function public.reserve_tier_stock(uuid, int) from anon, authenticated;
revoke all on function public.increment_coupon_use(text) from anon, authenticated;
