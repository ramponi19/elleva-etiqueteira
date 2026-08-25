"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";
import { mpDeclineMessage, mpErrorMessage } from "@/lib/payments/mp-messages";
import { markOrderPaid, claimSeats, refundOrder } from "@/lib/orders-helpers";
import { feeUnit, round2, DEFAULT_FEE_PCT } from "@/lib/fees";
import { isValidCPF } from "@/lib/cpf";
import { allowHit, clientIp } from "@/lib/rate-limit";

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Fail-safe: sem Mercado Pago configurado, o modo mock (aprova sem cobrar) só
// é permitido fora de produção — ou com opt-in explícito via env.
const mockAllowed = () =>
  process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENTS === "1";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const ItemSchema = z.object({
  eventId: z.string(),
  eventTitle: z.string(),
  tierId: z.string(),
  tierName: z.string(),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
  seatId: z.string().optional(),
  seatLabel: z.string().optional(),
});

const BaseSchema = z.object({
  buyerName: z.string().min(1, "Informe seu nome"),
  buyerEmail: z.string().email("E-mail inválido"),
  buyerCpf: z.string().refine(isValidCPF, { message: "Esse CPF não bateu. Confere os números?" }),
  buyerWhatsapp: z.string().optional(),
  couponCode: z.string().optional(),
  items: z.array(ItemSchema).min(1, "Carrinho vazio"),
});

type Items = z.infer<typeof ItemSchema>[];
type Svc = Awaited<ReturnType<typeof createServiceClient>>;

function subtotalOf(items: Items) {
  return items.reduce((a, i) => a + i.price * i.qty, 0);
}

// O preço e a taxa NUNCA vêm do navegador: para cada item buscamos o preço
// real do lote e o service_fee_pct do evento no banco. O price do cliente é
// ignorado (só serve pra exibição). Tiers mock (id não-uuid) só passam quando
// o modo mock é permitido (fora de produção).
type PricedItem = Items[number] & { isAddon: boolean; fee: number; feeAbsorbed: boolean };

async function priceItems(
  svc: Svc,
  items: Items
): Promise<{ items: PricedItem[]; fee: number; feeCobrada: number } | { error: string }> {
  const priced: PricedItem[] = [];
  let fee = 0;         // receita da Elleva (cobrada do comprador OU absorvida pelo produtor)
  let feeCobrada = 0;  // só o que entra no total do comprador
  for (const it of items) {
    if (isUuid(it.tierId)) {
      // TUDO que define preço, receita e a QUEM pertence a venda vem do banco,
      // nunca do carrinho. Antes, event_id/event_title/tier_name eram gravados
      // com o valor do cliente (C5): dava pra creditar a venda no evento de
      // outro produtor e gravar títulos falsos no ingresso/e-mail.
      const { data: tier } = await svc
        .from("ticket_tiers")
        .select("name, event_id, price, is_addon, events(title, status, starts_at, service_fee_pct, absorb_fee)")
        .eq("id", it.tierId)
        .single();
      if (!tier) return { error: `O ingresso "${it.tierName}" não está mais disponível.` };
      const ev = tier.events as unknown as
        | { title?: string; status?: string; starts_at?: string; service_fee_pct?: number; absorb_fee?: boolean }
        | null;
      // A4: só vende evento à venda (publicado/esgotado) e que ainda não começou.
      // Sem isto, cobrava-se por evento cancelado (dinheiro devido em reembolso),
      // rascunho (lido via service client, fora da RLS) ou já encerrado.
      if (!ev || (ev.status !== "published" && ev.status !== "sold_out")) {
        return { error: "Este evento não está disponível para compra." };
      }
      if (ev.starts_at && new Date(ev.starts_at).getTime() < Date.now()) {
        return { error: "As vendas para este evento já foram encerradas." };
      }
      const price = Number(tier.price);
      const pct = Number(ev.service_fee_pct ?? DEFAULT_FEE_PCT);
      const absorve = !!ev.absorb_fee;
      const itemFee = round2(feeUnit(price, pct) * it.qty);
      priced.push({
        ...it,
        eventId: (tier.event_id as string) ?? it.eventId,   // dono real da venda
        eventTitle: (ev.title as string) ?? it.eventTitle,  // título real
        tierName: (tier.name as string) ?? it.tierName,     // nome real do lote
        price, isAddon: !!tier.is_addon, fee: itemFee, feeAbsorbed: absorve,
      });
      fee += itemFee;
      if (!absorve) feeCobrada += itemFee;
    } else {
      if (!mockAllowed()) return { error: "Ingresso inválido." };
      const itemFee = round2(feeUnit(it.price, DEFAULT_FEE_PCT) * it.qty);
      priced.push({ ...it, isAddon: false, fee: itemFee, feeAbsorbed: false });
      fee += itemFee;
      feeCobrada += itemFee;
    }
  }
  // Um pedido = UM evento. O cancelamento reembolsa por pedido; se um pedido
  // misturasse eventos, cancelar um lesaria a compra do outro (e o rateio do
  // financeiro por evento ficaria ambíguo). Os event_id aqui já vêm do banco.
  const eventos = new Set(priced.filter((i) => isUuid(i.eventId)).map((i) => i.eventId));
  if (eventos.size > 1) {
    return { error: "Dá para comprar um evento por vez. Finalize este e faça outro pedido para o próximo." };
  }

  return { items: priced, fee: round2(fee), feeCobrada: round2(feeCobrada) };
}

/** total do comprador soma só a taxa NÃO absorvida (a absorvida sai do produtor) */
function finalTotals(items: Items, discount: number, feeCobrada: number) {
  const subtotal = subtotalOf(items);
  const d = Math.min(discount, subtotal);
  return { subtotal, discount: d, fee: feeCobrada, total: round2(subtotal - d + feeCobrada) };
}

/** Valida um cupom e retorna o desconto sobre o subtotal (0 se inválido). */
async function couponDiscount(
  svc: Svc,
  code: string | undefined,
  items: Items
): Promise<{ discount: number; code: string } | { error: string } | null> {
  if (!code || !code.trim()) return null;
  const norm = code.trim().toUpperCase();
  const { data: c } = await svc
    .from("coupons")
    .select("code, discount_type, discount_value, max_uses, used_count, active, expires_at, event_id")
    .eq("code", norm)
    .single();
  if (!c || !c.active) return { error: "Cupom inválido." };
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return { error: "Cupom expirado." };
  if (c.max_uses != null && c.used_count >= c.max_uses) return { error: "Cupom esgotado." };

  // cupom de produtor vale só pros itens do evento dele; global (event_id null) vale pra tudo
  const base = c.event_id
    ? items.filter((i) => isUuid(i.eventId) && i.eventId === c.event_id).reduce((a, i) => a + i.price * i.qty, 0)
    : subtotalOf(items);
  if (base <= 0) return { error: "Este cupom não vale para os itens do carrinho." };

  const raw = c.discount_type === "percent"
    ? Math.round(base * Number(c.discount_value)) / 100 // % exato em centavos (não arredonda pra real cheio)
    : Number(c.discount_value);
  const discount = Math.min(raw, base);
  return { discount, code: norm };
}

async function checkStock(svc: Svc, items: Items): Promise<string | null> {
  for (const it of items) {
    if (!isUuid(it.tierId)) continue;
    const { data: tier } = await svc
      .from("ticket_tiers")
      .select("capacity, sold, name")
      .eq("id", it.tierId)
      .single();
    if (tier && tier.capacity != null) {
      const available = Math.max(0, tier.capacity - (tier.sold ?? 0));
      if (it.qty > available) {
        return available === 0
          ? `"${tier.name}" está esgotado.`
          : `Restam apenas ${available} ingresso(s) de "${tier.name}".`;
      }
    }
  }
  return null;
}

async function insertPendingOrder(
  svc: Svc,
  data: { buyerName: string; buyerEmail: string; buyerCpf?: string; buyerWhatsapp?: string; method: "pix" | "card"; provider: string; items: PricedItem[]; itemsFee: number; itemsFeeCobrada?: number; userId: string | null; discount?: number; couponCode?: string | null }
): Promise<{ error: string } | { orderId: string; total: number }> {
  // `itemsFee` = receita total da Elleva; `itemsFeeCobrada` = o que o comprador paga
  const feeCobrada = data.itemsFeeCobrada ?? data.itemsFee;
  const { subtotal, discount, total } = finalTotals(data.items, data.discount ?? 0, feeCobrada);
  const fee = round2(data.itemsFee); // registra a receita cheia (inclui a absorvida)
  const { data: order, error } = await svc
    .from("orders")
    .insert({
      buyer_name: data.buyerName,
      buyer_email: data.buyerEmail,
      buyer_cpf: data.buyerCpf || null,
      buyer_whatsapp: data.buyerWhatsapp || null,
      payment_method: data.method,
      payment_provider: data.provider,
      status: "pending",
      subtotal, fee, total,
      discount,
      coupon_code: data.couponCode ?? null,
      user_id: data.userId,
    })
    .select("id")
    .single();
  if (error || !order) return { error: error?.message ?? "Falha ao criar pedido" };

  const { error: itemsErr } = await svc.from("order_items").insert(
    data.items.map((it) => ({
      order_id: order.id,
      tier_id: isUuid(it.tierId) ? it.tierId : null,
      event_id: isUuid(it.eventId) ? it.eventId : null,
      tier_name: it.tierName,
      event_title: it.eventTitle,
      unit_price: it.price,
      quantity: it.qty,
      is_addon: it.isAddon,
      fee: it.fee,
      fee_absorbed: it.feeAbsorbed,
      seat_id: it.seatId && isUuid(it.seatId) ? it.seatId : null,
    }))
  );
  if (itemsErr) {
    await svc.from("orders").delete().eq("id", order.id);
    return { error: itemsErr.message };
  }
  return { orderId: order.id as string, total };
}

/** Reserva os assentos do pedido (atômico). Em conflito, desfaz o pedido. */
async function claimOrFail(svc: Svc, orderId: string, items: PricedItem[]): Promise<string | null> {
  const seatIds = items
    .map((i) => i.seatId)
    .filter((s): s is string => !!s && isUuid(s));
  if (!seatIds.length) return null;
  const res = await claimSeats(svc, orderId, seatIds);
  if (!res.ok) {
    await svc.from("order_items").delete().eq("order_id", orderId);
    await svc.from("orders").delete().eq("id", orderId);
    return res.error;
  }
  return null;
}

async function currentUserId() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  return user?.id ?? null;
}

// ============================================================
// PIX (transparente) — ou mock se não houver MP
// ============================================================
export type CreateOrderResult =
  | { ok: true; orderId: string; paid: true }
  | { ok: true; orderId: string; paid: false; pix: { qrBase64: string; copyPaste: string }; total: number; expiresAt: string }
  | { ok: false; error: string };

const PIX_TTL_MIN = 30;
/** Mesmo instante expresso com offset -03:00 (exigido pelo Mercado Pago). */
function pixExpiration(minutes: number) {
  const at = new Date(Date.now() + minutes * 60000);
  const local = new Date(at.getTime() - 3 * 3600000).toISOString().replace("Z", "-03:00");
  return { iso: at.toISOString(), mp: local };
}

export async function createOrder(input: z.input<typeof BaseSchema>): Promise<CreateOrderResult> {
  const parsed = BaseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  let svc: Svc;
  try { svc = await createServiceClient(); } catch { return { ok: false, error: "Pagamento indisponível." }; }

  const priced = await priceItems(svc, parsed.data.items);
  if ("error" in priced) return { ok: false, error: priced.error };

  const stockErr = await checkStock(svc, priced.items);
  if (stockErr) return { ok: false, error: stockErr };

  const coupon = await couponDiscount(svc, parsed.data.couponCode, priced.items);
  if (coupon && "error" in coupon) return { ok: false, error: coupon.error };

  // Ingresso gratuito (ou 100% de desconto): total zero não passa pelo
  // gateway — confirma direto e emite os ingressos.
  const totals = finalTotals(priced.items, coupon?.discount ?? 0, priced.feeCobrada);
  if (totals.total <= 0) {
    const prep = await insertPendingOrder(svc, {
      ...parsed.data, items: priced.items, itemsFee: priced.fee, itemsFeeCobrada: priced.feeCobrada,
      method: "pix", provider: "free", userId: await currentUserId(),
      discount: coupon?.discount ?? 0, couponCode: coupon?.code ?? null,
    });
    if ("error" in prep) return { ok: false, error: prep.error };
    const seatErr = await claimOrFail(svc, prep.orderId, priced.items);
    if (seatErr) return { ok: false, error: seatErr };
    const mp = await markOrderPaid(svc, prep.orderId);
    if (!mp.ok) return { ok: false, error: "Esse ingresso esgotou agora. Nada foi cobrado." };
    return { ok: true, orderId: prep.orderId, paid: true };
  }

  const provider = getPaymentProvider();
  const configured = provider.isConfigured();
  if (!configured && !mockAllowed()) {
    return { ok: false, error: "Pagamento indisponível no momento. Tente novamente em instantes." };
  }
  const prep = await insertPendingOrder(svc, {
    ...parsed.data, items: priced.items, itemsFee: priced.fee, itemsFeeCobrada: priced.feeCobrada,
    method: "pix", provider: configured ? provider.id : "mock", userId: await currentUserId(),
    discount: coupon?.discount ?? 0, couponCode: coupon?.code ?? null,
  });
  if ("error" in prep) return { ok: false, error: prep.error };
  const seatErr = await claimOrFail(svc, prep.orderId, priced.items);
  if (seatErr) return { ok: false, error: seatErr };

  if (!configured) {
    const mp = await markOrderPaid(svc, prep.orderId);
    if (!mp.ok) return { ok: false, error: "Esse ingresso esgotou agora. Nada foi cobrado." };
    return { ok: true, orderId: prep.orderId, paid: true };
  }

  try {
    const [firstName, ...rest] = parsed.data.buyerName.trim().split(" ");
    const exp = pixExpiration(PIX_TTL_MIN);
    const pix = await provider.createPixCharge({
      amount: prep.total,
      description: `Elleva Tickets — pedido ${prep.orderId}`,
      orderId: prep.orderId,
      expiration: exp.mp,
      notificationUrl: `${APP_URL}/api/webhooks/${provider.id}`,
      buyer: {
        email: parsed.data.buyerEmail,
        firstName,
        lastName: rest.join(" ") || undefined,
        cpf: parsed.data.buyerCpf,
      },
    });
    await svc.from("orders").update({
      payment_id: pix.paymentId,
      pix_qr_base64: pix.qrBase64,
      pix_copy_paste: pix.copyPaste,
      expires_at: exp.iso,
    }).eq("id", prep.orderId);
    return { ok: true, orderId: prep.orderId, paid: false, pix: { qrBase64: pix.qrBase64, copyPaste: pix.copyPaste }, total: prep.total, expiresAt: exp.iso };
  } catch (e) {
    await svc.from("order_items").delete().eq("order_id", prep.orderId);
    await svc.from("orders").delete().eq("id", prep.orderId);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao gerar o Pix" };
  }
}

// ============================================================
// CARTÃO (transparente) — recebe token tokenizado no navegador
// ============================================================
const CardSchema = BaseSchema.extend({
  token: z.string().min(1),
  paymentMethodId: z.string().min(1),
  installments: z.number().int().min(1).max(12).default(1),
});

export type CardResult =
  | { ok: true; orderId: string; pending?: boolean }
  | { ok: false; error: string };

export async function createCardOrder(input: z.input<typeof CardSchema>): Promise<CardResult> {
  const parsed = CardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  // A7: o checkout transparente é um alvo para testar cartão roubado em lote —
  // e cada tentativa recusada conta contra a conta MP da Elleva (multa/risco de
  // descredenciamento). Teto por IP: 6 tentativas de cartão a cada 10 min.
  const ip = await clientIp();
  if (!(await allowHit(`card:${ip}`, 6, 600))) {
    return { ok: false, error: "Muitas tentativas de pagamento. Aguarde alguns minutos e tente de novo." };
  }

  const provider = getPaymentProvider();
  if (!provider.isConfigured()) return { ok: false, error: "Pagamento por cartão indisponível." };

  let svc: Svc;
  try { svc = await createServiceClient(); } catch { return { ok: false, error: "Pagamento indisponível." }; }

  const priced = await priceItems(svc, parsed.data.items);
  if ("error" in priced) return { ok: false, error: priced.error };

  // parcelas não podem passar do limite do(s) evento(s) — servidor é a fonte da verdade
  const evIds = [...new Set(priced.items.map((i) => i.eventId).filter(isUuid))];
  if (evIds.length) {
    const { data: evs } = await svc.from("events").select("max_installments").in("id", evIds);
    const maxAllowed = (evs ?? []).reduce((m, e) => Math.min(m, Number(e.max_installments ?? 12)), 12);
    if (parsed.data.installments > maxAllowed) {
      return { ok: false, error: `Este evento aceita no máximo ${maxAllowed}x no cartão.` };
    }
  }

  const stockErr = await checkStock(svc, priced.items);
  if (stockErr) return { ok: false, error: stockErr };

  const coupon = await couponDiscount(svc, parsed.data.couponCode, priced.items);
  if (coupon && "error" in coupon) return { ok: false, error: coupon.error };

  const prep = await insertPendingOrder(svc, {
    ...parsed.data, items: priced.items, itemsFee: priced.fee, itemsFeeCobrada: priced.feeCobrada,
    method: "card", provider: "mercadopago", userId: await currentUserId(),
    discount: coupon?.discount ?? 0, couponCode: coupon?.code ?? null,
  });
  if ("error" in prep) return { ok: false, error: prep.error };
  const seatErr = await claimOrFail(svc, prep.orderId, priced.items);
  if (seatErr) return { ok: false, error: seatErr };

  try {
    const res = await provider.createCardCharge({
      amount: prep.total,
      token: parsed.data.token,
      paymentMethodId: parsed.data.paymentMethodId,
      installments: parsed.data.installments,
      description: `Elleva Tickets — pedido ${prep.orderId}`,
      orderId: prep.orderId,
      notificationUrl: `${APP_URL}/api/webhooks/${provider.id}`,
      buyer: { email: parsed.data.buyerEmail, cpf: parsed.data.buyerCpf },
    });

    await svc.from("orders").update({ payment_id: res.paymentId }).eq("id", prep.orderId);

    if (res.status === "approved") {
      const mp = await markOrderPaid(svc, prep.orderId);
      if (!mp.ok) return { ok: false, error: "Esse ingresso esgotou agora — o valor foi estornado no seu cartão." };
      return { ok: true, orderId: prep.orderId };
    }
    if (res.status === "pending") {
      // em análise antifraude — webhook confirma (ou recusa) depois; NÃO é sucesso ainda
      return { ok: true, orderId: prep.orderId, pending: true };
    }
    // rejeitado
    await svc.from("orders").update({ status: "cancelled" }).eq("id", prep.orderId);
    return { ok: false, error: mpDeclineMessage(res.detail) };
  } catch (e) {
    await svc.from("orders").update({ status: "cancelled" }).eq("id", prep.orderId);
    // O SDK do Mercado Pago lança ApiError (não Error nativo) — extrai o motivo real
    // pra registrar no log e dar um retorno menos opaco ao comprador.
    const err = e as { message?: string; error?: string; status?: number; cause?: Array<{ code?: string; description?: string }> };
    const first = Array.isArray(err?.cause) ? err.cause[0] : undefined;
    const detail = first?.description || first?.code || err?.error || (e instanceof Error ? e.message : "");
    console.error("[createCardOrder] Mercado Pago falhou:", JSON.stringify({ detail, status: err?.status, cause: err?.cause }));
    // sempre pt-BR pro comprador; o texto cru (inglês) fica só no log acima
    return { ok: false, error: mpErrorMessage(detail) };
  }
}

/** Preview de cupom no checkout. */
export async function previewCoupon(
  code: string,
  items: z.input<typeof ItemSchema>[]
): Promise<{ ok: true; discount: number } | { ok: false; error: string }> {
  const parsedItems = z.array(ItemSchema).safeParse(items);
  if (!parsedItems.success) return { ok: false, error: "Itens inválidos" };
  // A7: previewCoupon diz se um código é válido — dá pra varrer palavras atrás
  // de cupons ativos. Teto por IP: 30 consultas / 5 min.
  if (!(await allowHit(`coupon:${await clientIp()}`, 30, 300))) {
    return { ok: false, error: "Muitas tentativas. Aguarde um momento." };
  }
  let svc: Svc;
  try { svc = await createServiceClient(); } catch { return { ok: false, error: "Indisponível" }; }
  const res = await couponDiscount(svc, code, parsedItems.data);
  if (!res) return { ok: false, error: "Informe um cupom." };
  if ("error" in res) return { ok: false, error: res.error };
  return { ok: true, discount: res.discount };
}

/** Reembolso pelo próprio comprador (autoatendimento). Regra: art. 49 do CDC —
 *  7 dias de arrependimento a partir do pagamento — E o evento ainda não pode
 *  ter começado. Reusa refundOrder (estorna no gateway + reverte). */
export async function requestSelfRefund(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const { user } = await getAuth();
  if (!user) return { ok: false, error: "Entre na sua conta para solicitar o reembolso." };
  let svc: Svc;
  try { svc = await createServiceClient(); } catch { return { ok: false, error: "Indisponível no momento." }; }

  const { data: o } = await svc.from("orders").select("user_id, status, paid_at, created_at").eq("id", orderId).single();
  if (!o || o.user_id !== user.id) return { ok: false, error: "Pedido não encontrado." };
  if (o.status !== "paid") return { ok: false, error: "Só um pedido pago pode ser reembolsado." };

  const base = (o.paid_at as string | null) ?? (o.created_at as string);
  if (Date.now() > new Date(base).getTime() + 7 * 86400000) {
    return { ok: false, error: "O prazo de 7 dias para reembolso automático já passou. Fale com a organização do evento." };
  }
  // evento já começou? não reembolsa por aqui
  const { data: its } = await svc.from("order_items").select("events(starts_at)").eq("order_id", orderId);
  const jaComecou = (its ?? []).some((it) => {
    const ev = it.events as unknown as { starts_at?: string } | null;
    return ev?.starts_at && new Date(ev.starts_at).getTime() < Date.now();
  });
  if (jaComecou) return { ok: false, error: "O evento já começou — o reembolso automático não vale mais." };

  const r = await refundOrder(svc, orderId);
  if (r.action === "failed") return { ok: false, error: "Não deu para concluir o reembolso agora. Tente de novo em instantes." };
  revalidatePath("/conta");
  return { ok: true };
}

/** Polling do status do pedido. */
export async function getOrderStatus(orderId: string): Promise<string | null> {
  try {
    const svc = await createServiceClient();
    const { data } = await svc.from("orders").select("status").eq("id", orderId).single();
    return (data?.status as string) ?? null;
  } catch {
    return null;
  }
}
