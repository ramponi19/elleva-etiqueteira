-- ============================================================
-- Agregações das telas de dashboard (mesma razão do 0043: PostgREST corta em
-- max-rows SEM erro, então somar linha por linha no app para de crescer).
-- ============================================================

-- Visão geral do admin: receita paga e nº de pedidos pagos (exatos).
create or replace function public.admin_overview_totals()
returns table (recebido numeric, taxa numeric, pedidos_pagos bigint)
language sql stable security definer set search_path = public
as $$
  select round(coalesce(sum(total), 0), 2),
         round(coalesce(sum(fee), 0), 2),
         count(*)::bigint
    from orders where status = 'paid'
$$;

-- Vendas do produtor por DIA (para KPIs + gráfico), já filtrado nos eventos dele.
create or replace function public.producer_sales_daily(p_producer uuid, p_days int default 400)
returns table (dia date, receita numeric, qtd bigint, pedidos bigint)
language sql stable security definer set search_path = public
as $$
  select (o.paid_at at time zone 'America/Sao_Paulo')::date as dia,
         round(sum(oi.unit_price * oi.quantity), 2) as receita,
         sum(case when coalesce(oi.is_addon, false) then 0 else oi.quantity end)::bigint as qtd,
         count(distinct o.id)::bigint as pedidos
    from order_items oi
    join orders o on o.id = oi.order_id and o.status = 'paid'
    join events e on e.id = oi.event_id
   where e.producer_id = p_producer
     and o.paid_at is not null
     and o.paid_at >= now() - make_interval(days => p_days)
   group by 1
   order by 1
$$;

-- Relatório de check-in do produtor, por EVENTO (antes agrupava por título e
-- incluía ingressos que o produtor comprou de terceiros).
create or replace function public.producer_checkin_report(p_producer uuid)
returns table (event_id uuid, title text, starts_at timestamptz, emitidos bigint, usados bigint)
language sql stable security definer set search_path = public
as $$
  select e.id, e.title, e.starts_at,
         count(t.id) filter (where t.status <> 'cancelled')::bigint as emitidos,
         count(t.id) filter (where t.status = 'used')::bigint as usados
    from events e
    left join tickets t on t.event_id = e.id
   where e.producer_id = p_producer
   group by e.id, e.title, e.starts_at
  having count(t.id) filter (where t.status <> 'cancelled') > 0
   order by e.starts_at desc
$$;

revoke all on function public.admin_overview_totals() from anon, authenticated;
revoke all on function public.producer_sales_daily(uuid, int) from anon, authenticated;
revoke all on function public.producer_checkin_report(uuid) from anon, authenticated;
