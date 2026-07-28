// ============================================================
// Núcleo financeiro — split contábil (produtor × Elleva) e saldo de repasse.
// Fonte única de verdade, reusada pelo Financeiro do produtor e do admin.
// ============================================================
// Modelo: a Elleva recebe tudo no gateway. NADA sai automático.
// - Bruto do produtor = valor de face dos ingressos pagos (unit_price × qty).
// - Taxa da Elleva = service_fee_pct sobre a face (paga pelo comprador, por cima).
// - Cupom de PRODUTOR (coupons.event_id != null) sai do líquido do produtor;
//   cupom global (event_id null) é bancado pela Elleva.
// - Líquido do produtor = bruto − cupons de produtor.
// - "Disponível" libera só depois do evento + margem de segurança (reembolso).
import type { createServiceClient } from "@/lib/supabase/server";
import { feeUnit, round2 } from "@/lib/fees";

type Svc = Awaited<ReturnType<typeof createServiceClient>>;

/** margem após o evento antes de liberar o saldo (proteção a reembolso/chargeback) */
export const SAFETY_DAYS = 2;

export interface EventoFin {
  eventId: string;
  title: string;
  startsAt: string | null;
  vendidos: number;   // ingressos pagos (unidades, sem add-on)
  bruto: number;      // face
  cupom: number;      // desconto de cupom de produtor (sai do líquido)
  liquido: number;    // bruto − cupom
  taxa: number;       // receita da Elleva neste evento
  liberado: boolean;  // evento já passou + margem
}

export interface ProducerFinance {
  eventos: EventoFin[];
  bruto: number;
  cupom: number;
  liquido: number;      // total líquido do produtor (todos os eventos pagos)
  taxaElleva: number;   // total de taxa gerado (receita Elleva)
  liberado: number;     // líquido de eventos já liberados
  aLiberar: number;     // líquido de eventos ainda retidos
  repassado: number;    // Σ payouts pagos
  solicitado: number;   // Σ payouts em aberto (requested)
  disponivel: number;   // liberado − repassado − solicitado (o que dá pra sacar)
}

function liberado(startsAt: string | null, now: number): boolean {
  if (!startsAt) return false;
  return new Date(startsAt).getTime() + SAFETY_DAYS * 86400000 < now;
}

type ItemRow = {
  event_id: string | null;
  unit_price: number;
  quantity: number;
  is_addon: boolean | null;
  order_id: string;
};

/** Calcula o financeiro de UM produtor (ou de um conjunto de eventos). */
export async function computeProducerFinance(svc: Svc, producerId: string, now = Date.now()): Promise<ProducerFinance> {
  const empty: ProducerFinance = { eventos: [], bruto: 0, cupom: 0, liquido: 0, taxaElleva: 0, liberado: 0, aLiberar: 0, repassado: 0, solicitado: 0, disponivel: 0 };

  const { data: evs } = await svc
    .from("events")
    .select("id, title, starts_at, service_fee_pct")
    .eq("producer_id", producerId)
    .order("starts_at", { ascending: false });
  if (!evs?.length) {
    // ainda pode ter payouts (raro) — busca mesmo assim
    return await withPayouts(svc, producerId, empty);
  }
  const evById = new Map(evs.map((e) => [e.id, e]));
  const ids = evs.map((e) => e.id);

  const { data: items } = await svc
    .from("order_items")
    .select("event_id, unit_price, quantity, is_addon, orders!inner(id, status, discount, coupon_code)")
    .in("event_id", ids)
    .eq("orders.status", "paid");

  // desconto de cupom de PRODUTOR por pedido (só cupom com event_id do produtor)
  const orderById = new Map<string, { discount: number; coupon: string | null }>();
  for (const it of (items ?? []) as unknown as (ItemRow & { orders: { id: string; discount: number; coupon_code: string | null } })[]) {
    const o = it.orders;
    if (o && !orderById.has(o.id)) orderById.set(o.id, { discount: Number(o.discount ?? 0), coupon: o.coupon_code ?? null });
  }
  const codes = [...new Set([...orderById.values()].map((o) => o.coupon).filter(Boolean))] as string[];
  const producerCouponCodes = new Set<string>();
  if (codes.length) {
    const { data: cps } = await svc.from("coupons").select("code, event_id").in("code", codes);
    for (const c of cps ?? []) if (c.event_id && ids.includes(c.event_id)) producerCouponCodes.add(c.code);
  }
  // rateia o desconto do pedido só uma vez por pedido (no evento do cupom)
  const producerDiscountByOrder = new Map<string, number>();
  for (const [oid, o] of orderById) {
    if (o.coupon && producerCouponCodes.has(o.coupon)) producerDiscountByOrder.set(oid, o.discount);
  }

  const agg = new Map<string, EventoFin>();
  for (const e of evs) {
    agg.set(e.id, {
      eventId: e.id, title: e.title, startsAt: e.starts_at,
      vendidos: 0, bruto: 0, cupom: 0, liquido: 0, taxa: 0,
      liberado: liberado(e.starts_at, now),
    });
  }
  const discountConsumed = new Set<string>();
  for (const it of (items ?? []) as unknown as (ItemRow & { orders: { id: string } })[]) {
    if (!it.event_id) continue;
    const a = agg.get(it.event_id);
    const e = evById.get(it.event_id);
    if (!a || !e) continue;
    const qty = it.quantity;
    const face = Number(it.unit_price) * qty;
    a.bruto += face;
    if (!it.is_addon) {
      a.vendidos += qty;
      a.taxa += feeUnit(Number(it.unit_price), Number(e.service_fee_pct ?? 10)) * qty;
    }
    // aplica o desconto de cupom de produtor uma vez (no primeiro item do pedido/evento)
    const oid = it.orders?.id;
    if (oid && producerDiscountByOrder.has(oid) && !discountConsumed.has(oid)) {
      a.cupom += producerDiscountByOrder.get(oid)!;
      discountConsumed.add(oid);
    }
  }

  let bruto = 0, cupom = 0, taxaElleva = 0, libAcc = 0, aLiberarAcc = 0;
  const eventos: EventoFin[] = [];
  for (const a of agg.values()) {
    a.bruto = round2(a.bruto); a.taxa = round2(a.taxa); a.cupom = round2(a.cupom);
    a.liquido = round2(Math.max(0, a.bruto - a.cupom));
    if (a.vendidos === 0 && a.bruto === 0) continue; // sem vendas: fora do extrato
    eventos.push(a);
    bruto += a.bruto; cupom += a.cupom; taxaElleva += a.taxa;
    if (a.liberado) libAcc += a.liquido; else aLiberarAcc += a.liquido;
  }

  const base: ProducerFinance = {
    eventos,
    bruto: round2(bruto), cupom: round2(cupom), liquido: round2(bruto - cupom),
    taxaElleva: round2(taxaElleva), liberado: round2(libAcc), aLiberar: round2(aLiberarAcc),
    repassado: 0, solicitado: 0, disponivel: 0,
  };
  return await withPayouts(svc, producerId, base);
}

export interface ProducerRow {
  producerId: string;
  nome: string;
  liquido: number;
  disponivel: number;
  solicitado: number;
  repassado: number;
  pixKey: string | null;
}
export interface PlatformFinance {
  gmv: number;          // valor de face vendido (todos os produtores)
  taxaTotal: number;    // RECEITA DA ELLEVA (soma das taxas)
  liquidoTotal: number; // total líquido dos produtores
  repassadoTotal: number;
  solicitadoTotal: number;
  produtores: ProducerRow[];
}

/** Visão financeira da plataforma (admin): receita de taxas separada + por produtor. */
export async function computePlatformFinance(svc: Svc, now = Date.now()): Promise<PlatformFinance> {
  const { data: evs } = await svc.from("events").select("producer_id").not("producer_id", "is", null);
  const producerIds = [...new Set((evs ?? []).map((e) => e.producer_id as string))];

  const { data: profs } = producerIds.length
    ? await svc.from("profiles").select("id, full_name, payout_pix_key").in("id", producerIds)
    : { data: [] as { id: string; full_name: string | null; payout_pix_key: string | null }[] };
  const profById = new Map((profs ?? []).map((p) => [p.id, p]));

  const produtores: ProducerRow[] = [];
  let gmv = 0, taxaTotal = 0, liquidoTotal = 0, repassadoTotal = 0, solicitadoTotal = 0;
  for (const pid of producerIds) {
    const fin = await computeProducerFinance(svc, pid, now);
    const prof = profById.get(pid);
    gmv += fin.bruto; taxaTotal += fin.taxaElleva; liquidoTotal += fin.liquido;
    repassadoTotal += fin.repassado; solicitadoTotal += fin.solicitado;
    produtores.push({
      producerId: pid,
      nome: prof?.full_name || "Produtor",
      liquido: fin.liquido, disponivel: fin.disponivel, solicitado: fin.solicitado, repassado: fin.repassado,
      pixKey: prof?.payout_pix_key ?? null,
    });
  }
  produtores.sort((a, b) => b.disponivel - a.disponivel);
  return {
    gmv: round2(gmv), taxaTotal: round2(taxaTotal), liquidoTotal: round2(liquidoTotal),
    repassadoTotal: round2(repassadoTotal), solicitadoTotal: round2(solicitadoTotal),
    produtores,
  };
}

async function withPayouts(svc: Svc, producerId: string, base: ProducerFinance): Promise<ProducerFinance> {
  const { data: pays } = await svc.from("payouts").select("amount, status").eq("producer_id", producerId);
  let repassado = 0, solicitado = 0;
  for (const p of pays ?? []) {
    if (p.status === "paid") repassado += Number(p.amount);
    else if (p.status === "requested") solicitado += Number(p.amount);
  }
  const disponivel = round2(Math.max(0, base.liberado - repassado - solicitado));
  return { ...base, repassado: round2(repassado), solicitado: round2(solicitado), disponivel };
}
