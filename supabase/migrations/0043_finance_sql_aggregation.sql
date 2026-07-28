-- ============================================================
-- Agregação financeira em SQL (soma no banco).
-- Motivo: o PostgREST corta em `max-rows` (1000) SEM erro — a agregação em
-- memória parava de crescer a partir de ~1000 itens pagos e os saldos podiam
-- oscilar. Aqui o banco soma tudo.
-- Bônus: a taxa da Elleva passa a vir de `orders.fee` (o valor REALMENTE
-- cobrado, imutável), rateado por evento — antes era recalculado com o
-- `service_fee_pct` ATUAL (renegociar a taxa reescrevia a receita histórica) e
-- ignorava a taxa cobrada sobre add-ons. Pedido legado sem `fee` cai no cálculo
-- pelo % do evento.
-- ============================================================

create or replace function public.finance_event_totals(p_producers uuid[] default null)
returns table (
  event_id uuid,
  producer_id uuid,
  title text,
  starts_at timestamptz,
  status text,
  vendidos bigint,
  bruto numeric,
  taxa numeric,
  cupom numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with paid_items as (
    select oi.order_id, oi.event_id, oi.quantity, oi.unit_price,
           coalesce(oi.is_addon, false) as is_addon,
           coalesce(o.fee, 0) as order_fee, coalesce(o.discount, 0) as order_discount, o.coupon_code,
           coalesce(e0.service_fee_pct, 10) as service_fee_pct
      from order_items oi
      join orders o on o.id = oi.order_id and o.status = 'paid'
      join events e0 on e0.id = oi.event_id
     where oi.event_id is not null
  ),
  order_face as (
    select order_id, sum(unit_price * quantity) as face
      from paid_items group by order_id
  ),
  per_event_order as (
    select pi.event_id,
           pi.order_id,
           sum(pi.unit_price * pi.quantity) as face_ev,
           sum(case when pi.is_addon then 0 else pi.quantity end) as qtd,
           max(pi.order_fee) as order_fee,
           -- fallback (pedido legado sem `fee`): mesma fórmula do feeUnit
           sum(round(pi.unit_price * pi.service_fee_pct) / 100 * pi.quantity) as fee_calc,
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
           case when peo.order_fee > 0 and coalesce(peo.face_total, 0) > 0
                then peo.order_fee * (peo.face_ev / peo.face_total)
                else coalesce(peo.fee_calc, 0) end), 0), 2) as taxa,
         round(coalesce(sum(case when c.event_id = e.id then peo.order_discount else 0 end), 0), 2) as cupom
    from events e
    left join per_event_order peo on peo.event_id = e.id
    left join coupons c on c.code = peo.coupon_code
   where e.producer_id is not null
     and (p_producers is null or e.producer_id = any(p_producers))
   group by e.id, e.producer_id, e.title, e.starts_at, e.status
$$;

-- somas de repasses e lançamentos por produtor (também no banco)
create or replace function public.finance_producer_totals(p_producers uuid[] default null)
returns table (
  producer_id uuid,
  repassado numeric,
  solicitado numeric,
  taxa_antecipacao numeric,
  committed_normal numeric,
  committed_advance numeric,
  creditos numeric,
  debitos numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with p as (
    select producer_id,
           sum(case when status = 'paid' then amount else 0 end) as repassado,
           sum(case when status = 'requested' then amount else 0 end) as solicitado,
           sum(case when status = 'paid' and kind = 'advance' then coalesce(fee_amount, 0) else 0 end) as taxa_antec,
           sum(case when status in ('paid','requested') and kind <> 'advance' then amount else 0 end) as c_normal,
           sum(case when status in ('paid','requested') and kind = 'advance' then amount else 0 end) as c_advance
      from payouts
     where (p_producers is null or producer_id = any(p_producers))
     group by producer_id
  ),
  a as (
    select producer_id,
           sum(case when kind = 'credit' then amount else 0 end) as creditos,
           sum(case when kind = 'debit' then amount else 0 end) as debitos
      from finance_adjustments
     where reversed_at is null
       and (p_producers is null or producer_id = any(p_producers))
     group by producer_id
  )
  select coalesce(p.producer_id, a.producer_id) as producer_id,
         round(coalesce(p.repassado, 0), 2), round(coalesce(p.solicitado, 0), 2),
         round(coalesce(p.taxa_antec, 0), 2),
         round(coalesce(p.c_normal, 0), 2), round(coalesce(p.c_advance, 0), 2),
         round(coalesce(a.creditos, 0), 2), round(coalesce(a.debitos, 0), 2)
    from p full outer join a on a.producer_id = p.producer_id
$$;

revoke all on function public.finance_event_totals(uuid[]) from anon, authenticated;
revoke all on function public.finance_producer_totals(uuid[]) from anon, authenticated;
