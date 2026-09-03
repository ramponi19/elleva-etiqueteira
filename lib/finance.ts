// ============================================================
// Núcleo financeiro — split contábil (produtor × Elleva), saldo, antecipação
// e lançamentos manuais. Fonte única de verdade do Financeiro (produtor e admin).
// ============================================================
// Modelo: a Elleva recebe tudo no gateway. NADA sai automático — todo repasse
// é concluído por um clique do admin (protege contra cancelamento de evento).
//
// - Bruto do produtor = face dos itens pagos (unit_price × qty).
// - Taxa da Elleva = `orders.fee` REALMENTE cobrado, rateado por evento (fonte
//   imutável: renegociar o % não reescreve a receita histórica).
// - Cupom de PRODUTOR (coupons.event_id != null) sai do líquido dele;
//   cupom global (event_id null) é bancado pela Elleva.
// - Saldo "a liberar" → "disponível" após o evento + SAFETY_DAYS.
// - Evento CANCELADO: dinheiro congelado (não libera nem antecipa) — é reembolso
//   devido aos compradores.
// - ANTECIPAÇÃO: o produtor saca o retido antes do evento pagando taxa % (receita
//   da Elleva). Abate o retido primeiro; nunca passa do saldo remanescente.
// - AJUSTES manuais (crédito/débito) entram no saldo na hora — autonomia do admin
//   pra chargeback, multa, acerto, bônus. Estornados saem do saldo, ficam no extrato.
//
// SOMA NO BANCO (migration 0043): as agregações vêm de `finance_event_totals` e
// `finance_producer_totals`. Antes eram somadas em memória, e o PostgREST corta
// em `max-rows` (1000) SEM erro — a receita parava de crescer e os saldos
// oscilavam a partir de ~1000 itens pagos.
import type { createServiceClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/fees";

type Svc = Awaited<ReturnType<typeof createServiceClient>>;

/** margem após o evento antes de liberar o saldo (proteção a reembolso/chargeback) */
export const SAFETY_DAYS = 2;
/** quantos lançamentos manuais recentes carregar para exibição */
const AJUSTES_LIMITE = 200;

export interface EventoFin {
  eventId: string;
  title: string;
  startsAt: string | null;
  vendidos: number;
  bruto: number;
  cupom: number;
  liquido: number;
  taxa: number;       // receita da Elleva neste evento
  absorvida: number;  // taxa que o PRODUTOR absorveu (sai do liquido dele)
  liberado: boolean;
  cancelado: boolean; // evento cancelado: NUNCA libera nem antecipa
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
  absorvida: number;    // taxa de servico que o produtor absorveu
  liquido: number;      // bruto − cupom − absorvida
  taxaElleva: number;   // taxa de serviço cobrada (receita Elleva)
  creditos: number;
  debitos: number;

  aLiberar: number;     // retido que AINDA será pago (já desconta antecipações)
  retidoBruto: number;  // retido total das vendas
  bloqueado: number;    // retido de evento CANCELADO
  jaAntecipado: number; // Σ antecipações comprometidas (solicitadas + pagas)
  disponivel: number;   // pode sacar já (nunca negativo)
  saldoReal: number;    // idem, SEM clamp: negativo = produtor deve à Elleva
  antecipavel: number;  // retido livre (dá pra antecipar)
  solicitado: number;   // Σ payouts requested (bruto)
  repassado: number;    // Σ payouts paid (bruto)
  taxaAntecipacao: number; // Σ fee_amount de antecipações pagas (receita Elleva)
}

function isLiberado(startsAt: string | null, now: number, status?: string | null): boolean {
  if (!startsAt) return false;
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

type EventTotalRow = {
  event_id: string; producer_id: string; title: string; starts_at: string | null; status: string | null;
  vendidos: number; bruto: number; taxa: number; cupom: number; absorvida: number;
};
type ProducerTotalRow = {
  producer_id: string; repassado: number; solicitado: number; taxa_antecipacao: number;
  committed_normal: number; committed_advance: number; creditos: number; debitos: number;
};

function nomeDe(p: ProfRow | undefined, pid: string) {
  return p?.full_name || p?.payout_holder || `Produtor ${pid.slice(0, 8)}`;
}

function vazio(pid: string): ProducerFinance {
  return {
    producerId: pid, nome: `Produtor ${pid.slice(0, 8)}`, pixKey: null,
    advanceEnabled: false, advanceFeePct: 5, eventos: [], ajustes: [],
    bruto: 0, cupom: 0, absorvida: 0, liquido: 0, taxaElleva: 0, creditos: 0, debitos: 0,
    aLiberar: 0, retidoBruto: 0, bloqueado: 0, jaAntecipado: 0, disponivel: 0,
    saldoReal: 0, antecipavel: 0, solicitado: 0, repassado: 0, taxaAntecipacao: 0,
  };
}

/** Agrega o financeiro de vários produtores (somas feitas no banco). */
async function aggregate(
  svc: Svc,
  producerIds: string[] | null,
  now: number
): Promise<Map<string, ProducerFinance>> {
  const arg = { p_producers: producerIds };
  const [evRows, totRows] = await Promise.all([
    (async () => (must(await svc.rpc("finance_event_totals", arg), "totais por evento") ?? []) as EventTotalRow[])(),
    (async () => (must(await svc.rpc("finance_producer_totals", arg), "totais por produtor") ?? []) as ProducerTotalRow[])(),
  ]);

  // Produtores que só têm repasse/lançamento (sem evento) também entram —
  // antes eles sumiam dos KPIs mas apareciam no extrato, e o fechamento não batia.
  const ids =
    producerIds ??
    [...new Set([...evRows.map((r) => r.producer_id), ...totRows.map((r) => r.producer_id)].filter(Boolean))];

  const profs = ids.length
    ? must(
        await svc
          .from("profiles")
          .select("id, full_name, payout_pix_key, payout_holder, advance_enabled, advance_fee_pct")
          .in("id", ids),
        "perfis"
      )
    : ([] as ProfRow[]);
  const profById = new Map((profs ?? []).map((p) => [p.id, p as ProfRow]));

  const out = new Map<string, ProducerFinance>();
  for (const pid of ids) {
    const p = profById.get(pid);
    out.set(pid, {
      ...vazio(pid),
      nome: nomeDe(p, pid),
      pixKey: p?.payout_pix_key ?? null,
      advanceEnabled: !!p?.advance_enabled,
      advanceFeePct: Number(p?.advance_fee_pct ?? 5),
    });
  }

  // eventos → produtor
  const releasedVendasPor = new Map<string, number>();
  for (const r of evRows) {
    const acc = out.get(r.producer_id);
    if (!acc) continue;
    const bruto = round2(Number(r.bruto));
    const cupom = round2(Number(r.cupom));
    const taxa = round2(Number(r.taxa));
    const absorvida = round2(Number(r.absorvida ?? 0));
    const vendidos = Number(r.vendidos);
    if (bruto === 0 && vendidos === 0) continue; // sem venda: fora do extrato
    const cancelado = r.status === "cancelled";
    const liberado = isLiberado(r.starts_at, now, r.status);
    // quando o produtor absorve a taxa, ela sai do liquido dele
    const liquido = round2(Math.max(0, bruto - cupom - absorvida));
    acc.eventos.push({
      eventId: r.event_id, title: r.title, startsAt: r.starts_at,
      vendidos, bruto, cupom, liquido, taxa, absorvida, liberado, cancelado,
    });
    acc.bruto += bruto;
    acc.cupom += cupom;
    acc.absorvida += absorvida;
    acc.taxaElleva += taxa;
    if (liberado) releasedVendasPor.set(r.producer_id, (releasedVendasPor.get(r.producer_id) ?? 0) + liquido);
    else acc.retidoBruto += liquido;
    if (cancelado) acc.bloqueado += liquido;
  }

  // lançamentos (lista só pra exibição; os totais vêm do banco)
  let adjq = svc
    .from("finance_adjustments")
    .select("id, producer_id, kind, amount, reason, created_at")
    .is("reversed_at", null);
  if (producerIds) adjq = adjq.in("producer_id", producerIds);
  const adjs = must(await adjq.order("created_at", { ascending: false }).limit(AJUSTES_LIMITE), "lancamentos");
  for (const a of adjs ?? []) {
    const acc = out.get(a.producer_id as string);
    if (!acc) continue;
    acc.ajustes.push({
      id: a.id as string, kind: a.kind as "credit" | "debit",
      amount: Number(a.amount), reason: a.reason as string, createdAt: a.created_at as string,
    });
  }

  const totById = new Map(totRows.map((t) => [t.producer_id, t]));

  for (const acc of out.values()) {
    const t = totById.get(acc.producerId);
    acc.repassado = round2(Number(t?.repassado ?? 0));
    acc.solicitado = round2(Number(t?.solicitado ?? 0));
    acc.taxaAntecipacao = round2(Number(t?.taxa_antecipacao ?? 0));
    acc.creditos = round2(Number(t?.creditos ?? 0));
    acc.debitos = round2(Number(t?.debitos ?? 0));
    const cNormal = round2(Number(t?.committed_normal ?? 0));
    const cAdvance = round2(Number(t?.committed_advance ?? 0));

    const releasedVendas = round2(releasedVendasPor.get(acc.producerId) ?? 0);
    const liquido = round2(acc.bruto - acc.cupom - acc.absorvida);
    const pot = round2(liquido + acc.creditos - acc.debitos);
    const releasedPot = round2(releasedVendas + acc.creditos - acc.debitos);
    const retidoBruto = round2(acc.retidoBruto);
    const bloqueado = round2(acc.bloqueado);

    // antecipação abate o retido; o excedente cai sobre o liberado
    const sobraAntecip = round2(Math.max(0, cAdvance - retidoBruto));
    const disponivel = round2(Math.max(0, releasedPot - cNormal - sobraAntecip));
    // saldo REAL (pode ser negativo): o que a Elleva tem a receber do produtor
    const saldoReal = round2(releasedPot - cNormal - sobraAntecip);
    // teto do antecipável: nunca além do saldo remanescente nem do que está
    // congelado por cancelamento
    const saldoRemanescente = round2(pot - cNormal - cAdvance);
    const antecipavel = round2(Math.max(0, Math.min(retidoBruto - cAdvance - bloqueado, saldoRemanescente)));

    acc.bruto = round2(acc.bruto);
    acc.cupom = round2(acc.cupom);
    acc.absorvida = round2(acc.absorvida);
    acc.liquido = liquido;
    acc.taxaElleva = round2(acc.taxaElleva);
    acc.retidoBruto = retidoBruto;
    acc.bloqueado = bloqueado;
    acc.jaAntecipado = cAdvance;
    // M-7: exclui o retido de evento cancelado (bloqueado) — ele não vai liberar,
    // então somá-lo superestimava o "a liberar" no extrato.
    acc.aLiberar = round2(Math.max(0, retidoBruto - cAdvance - bloqueado));
    acc.disponivel = disponivel;
    acc.saldoReal = saldoReal;
    acc.antecipavel = antecipavel;
    acc.eventos.sort((a, b) => (b.startsAt ?? "").localeCompare(a.startsAt ?? ""));
  }
  return out;
}

/** Financeiro de UM produtor. */
export async function computeProducerFinance(svc: Svc, producerId: string, now = Date.now()): Promise<ProducerFinance> {
  const map = await aggregate(svc, [producerId], now);
  return map.get(producerId) ?? vazio(producerId);
}

export interface PlatformFinance {
  gmv: number;
  taxaTotal: number;
  antecipacaoTotal: number;
  receitaTotal: number;
  liquidoTotal: number;
  aPagarTotal: number;
  retidoTotal: number;
  pendentesTotal: number;
  repassadoTotal: number;
  deficitTotal: number; // Σ saldos negativos: a Elleva tem a receber
  produtores: ProducerFinance[];
}

/** Visão da plataforma (admin) — receita separada + saldo de cada produtor. */
export async function computePlatformFinance(svc: Svc, now = Date.now()): Promise<PlatformFinance> {
  const map = await aggregate(svc, null, now);
  const produtores = [...map.values()].filter(
    (p) => p.bruto > 0 || p.repassado > 0 || p.solicitado > 0 || p.ajustes.length > 0
  );
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
    deficitTotal: sum((p) => (p.saldoReal < 0 ? -p.saldoReal : 0)),
    produtores,
  };
}
