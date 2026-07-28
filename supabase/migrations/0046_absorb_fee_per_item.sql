-- ============================================================
-- "Absorver a taxa de serviço" passa a FUNCIONAR de verdade.
-- Antes o produtor marcava o checkbox e o comprador continuava pagando a taxa
-- por cima (a coluna `absorb_fee` era gravada e ignorada).
-- Agora: quando o evento absorve, a taxa NÃO é somada ao total do comprador —
-- ela sai do líquido do produtor. A Elleva recebe igual nos dois casos.
--
-- Guardamos a taxa POR ITEM (imutável), o que também torna a receita por evento
-- exata: acaba o rateio da fee do pedido entre eventos.
-- ============================================================
alter table public.order_items
  add column if not exists fee numeric not null default 0,
  add column if not exists fee_absorbed boolean not null default false;

-- Backfill dos pedidos existentes: rateia a fee do pedido pela participação de
-- cada item na face, pra o histórico continuar batendo no cálculo novo.
with face as (
  select order_id, sum(unit_price * quantity) as total_face
    from order_items group by order_id
)
update order_items oi
   set fee = round(coalesce(o.fee, 0) * (oi.unit_price * oi.quantity) / nullif(f.total_face, 0), 2)
  from orders o
  join face f on f.order_id = o.id
 where o.id = oi.order_id
   and oi.fee = 0
   and coalesce(o.fee, 0) > 0
   and f.total_face > 0;

drop function if exists public.finance_event_totals(uuid[]);

create function public.finance_event_totals(p_producers uuid[] default null)
returns table (
  event_id uuid,
  producer_id uuid,
  title text,
  starts_at timestamptz,
  status text,
  vendidos bigint,
  bruto numeric,
  taxa numeric,
  cupom numeric,
  absorvida numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with paid_items as (
    select oi.order_id, oi.event_id, oi.quantity, oi.unit_price,
           coalesce(oi.is_addon, false) as is_addon,
           coalesce(oi.fee, 0) as item_fee,
           coalesce(oi.fee_absorbed, false) as item_absorbed,
           coalesce(o.fee, 0) as order_fee, coalesce(o.discount, 0) as order_discount, o.coupon_code
      from order_items oi
      join orders o on o.id = oi.order_id and o.status = 'paid'
     where oi.event_id is not null
  ),
  order_face as (
    select order_id, sum(unit_price * quantity) as face from paid_items group by order_id
  ),
  per_event_order as (
    select pi.event_id, pi.order_id,
           sum(pi.unit_price * pi.quantity) as face_ev,
           sum(case when pi.is_addon then 0 else pi.quantity end) as qtd,
           sum(pi.item_fee) as fee_itens,
           sum(case when pi.item_absorbed then pi.item_fee else 0 end) as fee_absorvida,
           max(pi.order_fee) as order_fee,
           max(pi.order_discount) as order_discount,
           max(pi.coupon_code) as coupon_code,
           max(f.face) as face_total
      from paid_items pi
      join order_face f on f.order_id = pi.order_id
     group by pi.event_id, pi.order_id
  )
  select e.id, e.producer_id, e.title, e.starts_at, e.status,
         coalesce(sum(peo.qtd), 0)::bigint as vendidos,
         round(coalesce(sum(peo.face_ev), 0), 2) as bruto,
         round(coalesce(sum(
           case when peo.fee_itens > 0 then peo.fee_itens
                when peo.order_fee > 0 and coalesce(peo.face_total, 0) > 0
                  then peo.order_fee * (peo.face_ev / peo.face_total)
                else 0 end), 0), 2) as taxa,
         round(coalesce(sum(case when c.event_id = e.id then peo.order_discount else 0 end), 0), 2) as cupom,
         round(coalesce(sum(peo.fee_absorvida), 0), 2) as absorvida
    from events e
    left join per_event_order peo on peo.event_id = e.id
    left join coupons c on c.code = peo.coupon_code
   where e.producer_id is not null
     and (p_producers is null or e.producer_id = any(p_producers))
   group by e.id, e.producer_id, e.title, e.starts_at, e.status
$$;

revoke all on function public.finance_event_totals(uuid[]) from anon, authenticated;
