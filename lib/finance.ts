// ============================================================
// Núcleo financeiro — split contábil (produtor × Elleva), saldo, antecipação
// e lançamentos manuais. Fonte única de verdade do Financeiro (produtor e admin).
// ============================================================
// Modelo: a Elleva recebe tudo no gateway. NADA sai automático — todo repasse
// é concluído por um clique do admin (protege contra cancelamento de evento).
//
// - Bruto do produtor = face dos ingressos pagos (unit_price × qty).
// - Taxa da Elleva = service_fee_pct sobre a face (paga pelo comprador, por cima).
// - Cupom de PRODUTOR (coupons.event_id != null) sai do líquido dele;
//   cupom global (event_id null) é bancado pela Elleva.
// - Saldo "a liberar" → "disponível" após o evento + SAFETY_DAYS.
// - ANTECIPAÇÃO: o produtor pode sacar o retido antes do evento pagando uma
//   taxa % (definida pelo admin, por produtor). A taxa é receita da Elleva.
// - AJUSTES manuais (crédito/débito) entram no saldo imediatamente — é a
//   autonomia do admin pra chargeback, multa, acerto, bônus.
//
// Agregação em UMA passada (sem N+1): busca eventos/itens/payouts/ajustes de
// todos os produtores pedidos e monta o resultado em memória.
import type { createServiceClient } from "@/lib/supabase/server";
import { feeUnit, round2 } from "@/lib/fees";

type Svc = Awaited<ReturnType<typeof createServiceClient>>;

/** margem após o evento antes de liberar o saldo (proteção a reembolso/chargeback) */
export const SAFETY_DAYS = 2;

export interface EventoFin {
  eventId: string;
  title: string;
  startsAt: string | null;
  vendidos: number;
  bruto: number;
  cupom: number;
  liquido: number;
  taxa: number;      // receita da Elleva neste evento
  liberado: boolean;
  cancelado: boolean; // evento cancelado: NUNCA libera saldo automaticamente
}

export interface AjusteFin {
  id: string;
  kind: "credit" | "debit";
  amount: number;
  reason: string;
  createdAt: string;
}

export interface ProducerFinance {
  producerId: string;
  nome: string;
  pixKey: string | null;
  advanceEnabled: boolean;
  advanceFeePct: number;

  eventos: EventoFin[];
  ajustes: AjusteFin[];

  bruto: number;        // face vendida
  cupom: number;        // cupons do produtor
  liquido: number;      // bruto − cupom
  taxaElleva: number;   // taxa de serviço gerada (receita Elleva)
  creditos: number;
  debitos: number;

  aLiberar: number;     // retido que AINDA será pago (já desconta antecipações)
  retidoBruto: number;  // retido total das vendas (antes de descontar antecipação)
  bloqueado: number;    // retido de evento CANCELADO: não libera nem antecipa
  jaAntecipado: number; // Σ antecipações comprometidas (solicitadas + pagas)
  disponivel: number;   // pode sacar já (nunca negativo)
  saldoReal: number;    // idem, SEM clamp: negativo = produtor deve à Elleva
  antecipavel: number;  // retido não comprometido (dá pra antecipar)
  solicitado: number;   // Σ payouts requested (bruto)
  repassado: number;    // Σ payouts paid (bruto)
  taxaAntecipacao: number; // Σ fee_amount de antecipações pagas (receita Elleva)
}

function isLiberado(startsAt: string | null, now: number, status?: string | null): boolean {
  if (!startsAt) return false;
  // Evento CANCELADO não libera saldo: os compradores ainda têm reembolso a
  // receber, então esse dinheiro não é do produtor.
  if (status === "cancelled") return false;
  return new Date(startsAt).getTime() + SAFETY_DAYS * 86400000 < now;
}

/** Query que falha NÃO pode virar "saldo R$ 0,00" silencioso. */
function must<T>(res: { data: T; error: { message: string } | null }, ctx: string): T {
  if (res.error) throw new Error(`[finance] falha ao ler ${ctx}: ${res.error.message}`);
  return res.data;
}

type ProfRow = {
  id: string;
  full_name: string | null;
  payout_pix_key: string | null;
  payout_holder: string | null;
  advance_enabled: boolean | null;
  advance_fee_pct: number | null;
};

function nomeDe(p: ProfRow | undefined, pid: string) {
  return p?.full_name || p?.payout_holder || `Produtor ${pid.slice(0, 8)}`;
}

/** Agrega o financeiro de vários produtores numa passada. */
async function aggregate(
  svc: Svc,
  producerIds: string[] | null,
  now: number
): Promise<Map<string, ProducerFinance>> {
  // eventos (com dono)
  let evq = svc.from("events").select("id, title, starts_at, service_fee_pct, producer_id, status").not("producer_id", "is", null);
  if (producerIds) evq = evq.in("producer_id", producerIds);
  const eventos = must(await evq.order("starts_at", { ascending: false }), "eventos") ?? [];
  const ids = producerIds ?? [...new Set(eventos.map((e) => e.producer_id as string))];

  const profs = ids.length
    ? must(await svc.from("profiles").select("id, full_name, payout_pix_key, payout_holder, advance_enabled, advance_fee_pct").in("id", ids), "perfis")
    : ([] as ProfRow[]);
  const profById = new Map((profs ?? []).map((p) => [p.id, p as ProfRow]));

  // resultado base por produtor
  const out = new Map<string, ProducerFinance>();
  for (const pid of ids) {
    const p = profById.get(pid);
    out.set(pid, {
      producerId: pid,
      nome: nomeDe(p, pid),
      pixKey: p?.payout_pix_key ?? null,
      advanceEnabled: !!p?.advance_enabled,
      advanceFeePct: Number(p?.advance_fee_pct ?? 5),
      eventos: [], ajustes: [],
      bruto: 0, cupom: 0, liquido: 0, taxaElleva: 0, creditos: 0, debitos: 0,
      aLiberar: 0, retidoBruto: 0, bloqueado: 0, jaAntecipado: 0, disponivel: 0, saldoReal: 0, antecipavel: 0, solicitado: 0, repassado: 0, taxaAntecipacao: 0,
    });
  }

  const eventIds = eventos.map((e) => e.id);
  const ownerOf = new Map(eventos.map((e) => [e.id, e.producer_id as string]));
  const evById = new Map(eventos.map((e) => [e.id, e]));

  // itens pagos
  type ItemRow = {
    event_id: string | null; unit_price: number; quantity: number; is_addon: boolean | null;
    orders: { id: string; status: string; discount: number | null; coupon_code: string | null } | null;
  };
  let items: ItemRow[] = [];
  if (eventIds.length) {
    const data = must(await svc
      .from("order_items")
      .select("event_id, unit_price, quantity, is_addon, orders!inner(id, status, discount, coupon_code)")
      .in("event_id", eventIds)
      .eq("orders.status", "paid"), "itens pagos");
    items = (data ?? []) as unknown as ItemRow[];
  }

  // quais cupons usados são de PRODUTOR (têm event_id)
  const codes = [...new Set(items.map((i) => i.orders?.coupon_code).filter(Boolean))] as string[];
  const couponEvent = new Map<string, string>();
  if (codes.length) {
    const cps = must(await svc.from("coupons").select("code, event_id").in("code", codes), "cupons");
    for (const c of cps ?? []) if (c.event_id) couponEvent.set(c.code, c.event_id);
  }

  // agrega por evento
  const evAgg = new Map<string, EventoFin>();
  for (const e of eventos) {
    evAgg.set(e.id, {
      eventId: e.id, title: e.title, startsAt: e.starts_at,
      vendidos: 0, bruto: 0, cupom: 0, liquido: 0, taxa: 0,
      liberado: isLiberado(e.starts_at, now, e.status as string | null),
      cancelado: e.status === "cancelled",
    });
  }
  const descontoAplicado = new Set<string>(); // 1x por pedido
  for (const it of items) {
    if (!it.event_id) continue;
    const a = evAgg.get(it.event_id);
    const e = evById.get(it.event_id);
    if (!a || !e) continue;
    a.bruto += Number(it.unit_price) * it.quantity;
    if (!it.is_addon) {
      a.vendidos += it.quantity;
      a.taxa += feeUnit(Number(it.unit_price), Number(e.service_fee_pct ?? 10)) * it.quantity;
    }
    const o = it.orders;
    if (o?.coupon_code && !descontoAplicado.has(o.id)) {
      const cupomEv = couponEvent.get(o.coupon_code);
      if (cupomEv === it.event_id) {
        a.cupom += Number(o.discount ?? 0);
        descontoAplicado.add(o.id);
      }
    }
  }

  // joga os eventos nos produtores
  for (const a of evAgg.values()) {
    const pid = ownerOf.get(a.eventId);
    const acc = pid ? out.get(pid) : null;
    if (!acc) continue;
    a.bruto = round2(a.bruto); a.taxa = round2(a.taxa); a.cupom = round2(a.cupom);
    a.liquido = round2(Math.max(0, a.bruto - a.cupom));
    if (a.bruto === 0 && a.vendidos === 0) continue; // sem venda: fora do extrato
    acc.eventos.push(a);
    acc.bruto += a.bruto; acc.cupom += a.cupom; acc.taxaElleva += a.taxa;
    if (a.liberado) acc.disponivel += a.liquido; // usado como "releasedPot" temporário
    else acc.aLiberar += a.liquido;
    // Evento cancelado: o dinheiro fica CONGELADO (os compradores têm reembolso
    // a receber). Não libera e também não pode ser antecipado.
    if (a.cancelado) acc.bloqueado += a.liquido;
  }

  // ajustes manuais
  // estornados (reversed_at) saem do saldo mas continuam no extrato
  let adjq = svc.from("finance_adjustments").select("id, producer_id, kind, amount, reason, created_at").is("reversed_at", null);
  if (producerIds) adjq = adjq.in("producer_id", producerIds);
  const adjs = must(await adjq.order("created_at", { ascending: false }), "lancamentos");
  for (const a of adjs ?? []) {
    const acc = out.get(a.producer_id as string);
    if (!acc) continue;
    const amount = Number(a.amount);
    acc.ajustes.push({ id: a.id as string, kind: a.kind as "credit" | "debit", amount, reason: a.reason as string, createdAt: a.created_at as string });
    if (a.kind === "credit") acc.creditos += amount; else acc.debitos += amount;
  }

  // payouts — separa o comprometido por tipo: antecipação consome o RETIDO
  // primeiro (senão anteciparia "gastando" o saldo já liberado).
  const committed = new Map<string, { normal: number; advance: number }>();
  let payq = svc.from("payouts").select("producer_id, amount, status, kind, fee_amount");
  if (producerIds) payq = payq.in("producer_id", producerIds);
  const pays = must(await payq, "repasses");
  for (const p of pays ?? []) {
    const pid = p.producer_id as string;
    const acc = out.get(pid);
    if (!acc) continue;
    const amount = Number(p.amount);
    const isAdvance = p.kind === "advance";
    if (p.status === "paid") {
      acc.repassado += amount;
      if (isAdvance) acc.taxaAntecipacao += Number(p.fee_amount ?? 0);
    } else if (p.status === "requested") acc.solicitado += amount;
    if (p.status === "paid" || p.status === "requested") {
      const c = committed.get(pid) ?? { normal: 0, advance: 0 };
      if (isAdvance) c.advance += amount; else c.normal += amount;
      committed.set(pid, c);
    }
  }

  // fecha as contas (modelo de "pote"): ajustes entram como liberados
  for (const acc of out.values()) {
    const releasedVendas = acc.disponivel; // acumulado acima
    const liquido = round2(acc.bruto - acc.cupom);
    const pot = round2(liquido + acc.creditos - acc.debitos);
    const releasedPot = round2(releasedVendas + acc.creditos - acc.debitos);
    const retidoBruto = round2(Math.max(0, pot - releasedPot));
    const c = committed.get(acc.producerId) ?? { normal: 0, advance: 0 };
    // antecipação abate o retido; o que passar disso cai sobre o liberado
    const sobraAntecip = round2(Math.max(0, c.advance - retidoBruto));
    const disponivel = round2(Math.max(0, releasedPot - c.normal - sobraAntecip));
    // Saldo REAL (pode ser negativo) — é o que a Elleva tem a receber do
    // produtor quando um reembolso/débito entra depois de um repasse.
    const saldoReal = round2(releasedPot - c.normal - sobraAntecip);
    // Antecipável NUNCA pode passar do saldo total remanescente: débitos
    // (chargeback/multa) não entram no "retido" (eles se cancelam no cálculo),
    // então sem esse teto o produtor antecipava dinheiro já cobrado de volta.
    const saldoTotalRemanescente = round2(pot - c.normal - c.advance);
    // desconta também o retido de evento cancelado (congelado)
    const antecipavel = round2(
      Math.max(0, Math.min(retidoBruto - c.advance - acc.bloqueado, saldoTotalRemanescente))
    );

    acc.liquido = liquido;
    acc.bruto = round2(acc.bruto);
    acc.cupom = round2(acc.cupom);
    acc.taxaElleva = round2(acc.taxaElleva);
    acc.creditos = round2(acc.creditos);
    acc.debitos = round2(acc.debitos);
    acc.aLiberar = round2(Math.max(0, retidoBruto - c.advance)); // desconta o já antecipado
    acc.retidoBruto = retidoBruto;
    acc.bloqueado = round2(acc.bloqueado);
    acc.jaAntecipado = round2(c.advance);
    acc.disponivel = disponivel;
    acc.saldoReal = saldoReal;
    acc.antecipavel = antecipavel;
    acc.solicitado = round2(acc.solicitado);
    acc.repassado = round2(acc.repassado);
    acc.taxaAntecipacao = round2(acc.taxaAntecipacao);
    acc.eventos.sort((a, b) => (b.startsAt ?? "").localeCompare(a.startsAt ?? ""));
  }
  return out;
}

/** Financeiro de UM produtor. */
export async function computeProducerFinance(svc: Svc, producerId: string, now = Date.now()): Promise<ProducerFinance> {
  const map = await aggregate(svc, [producerId], now);
  return (
    map.get(producerId) ?? {
      producerId, nome: "Produtor", pixKey: null, advanceEnabled: false, advanceFeePct: 5,
      eventos: [], ajustes: [], bruto: 0, cupom: 0, liquido: 0, taxaElleva: 0, creditos: 0, debitos: 0,
      aLiberar: 0, retidoBruto: 0, bloqueado: 0, jaAntecipado: 0, disponivel: 0, saldoReal: 0, antecipavel: 0, solicitado: 0, repassado: 0, taxaAntecipacao: 0,
    }
  );
}

export interface PlatformFinance {
  gmv: number;              // face vendida (total)
  taxaTotal: number;        // receita de taxa de serviço
  antecipacaoTotal: number; // receita de taxa de antecipação
  receitaTotal: number;     // taxaTotal + antecipacaoTotal
  liquidoTotal: number;     // líquido dos produtores
  aPagarTotal: number;      // Σ disponível (o que a Elleva deve agora)
  retidoTotal: number;      // Σ a liberar
  pendentesTotal: number;   // Σ solicitado
  repassadoTotal: number;   // Σ pago
  produtores: ProducerFinance[];
}

/** Visão da plataforma (admin) — receita separada + saldo de cada produtor. */
export async function computePlatformFinance(svc: Svc, now = Date.now()): Promise<PlatformFinance> {
  const map = await aggregate(svc, null, now);
  const produtores = [...map.values()].filter((p) => p.bruto > 0 || p.repassado > 0 || p.solicitado > 0 || p.ajustes.length > 0);
  const sum = (f: (p: ProducerFinance) => number) => round2(produtores.reduce((a, p) => a + f(p), 0));
  const taxaTotal = sum((p) => p.taxaElleva);
  const antecipacaoTotal = sum((p) => p.taxaAntecipacao);
  produtores.sort((a, b) => b.disponivel - a.disponivel || b.liquido - a.liquido);
  return {
    gmv: sum((p) => p.bruto),
    taxaTotal,
    antecipacaoTotal,
    receitaTotal: round2(taxaTotal + antecipacaoTotal),
    liquidoTotal: sum((p) => p.liquido),
    aPagarTotal: sum((p) => p.disponivel),
    retidoTotal: sum((p) => p.aLiberar),
    pendentesTotal: sum((p) => p.solicitado),
    repassadoTotal: sum((p) => p.repassado),
    produtores,
  };
}
