"use server";

import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";
import { mpDeclineMessage } from "@/lib/payments/mp-messages";
import { markOrderPaid, claimSeats } from "@/lib/orders-helpers";
import { feeUnit, round2, DEFAULT_FEE_PCT } from "@/lib/fees";
import { isValidCPF } from "@/lib/cpf";

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
type PricedItem = Items[number] & { isAddon: boolean };

async function priceItems(
  svc: Svc,
  items: Items
): Promise<{ items: PricedItem[]; fee: number } | { error: string }> {
  const priced: PricedItem[] = [];
  let fee = 0;
  for (const it of items) {
    if (isUuid(it.tierId)) {
      const { data: tier } = await svc
        .from("ticket_tiers")
        .select("price, is_addon, events(service_fee_pct)")
        .eq("id", it.tierId)
        .single();
      if (!tier) return { error: `O lote "${it.tierName}" não está mais disponível.` };
      const price = Number(tier.price);
      const ev = tier.events as unknown as { service_fee_pct?: number } | null;
      const pct = Number(ev?.service_fee_pct ?? DEFAULT_FEE_PCT);
      priced.push({ ...it, price, isAddon: !!tier.is_addon });
      fee += feeUnit(price, pct) * it.qty;
    } else {
      if (!mockAllowed()) return { error: "Ingresso inválido." };
      priced.push({ ...it, isAddon: false });
      fee += feeUnit(it.price, DEFAULT_FEE_PCT) * it.qty;
    }
  }
  return { items: priced, fee: round2(fee) };
}

function finalTotals(items: Items, discount: number, fee: number) {
  const subtotal = subtotalOf(items);
  const d = Math.min(discount, subtotal);
  return { subtotal, discount: d, fee, total: round2(subtotal - d + fee) };
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
  data: { buyerName: string; buyerEmail: string; buyerCpf?: string; buyerWhatsapp?: string; method: "pix" | "card"; provider: string; items: PricedItem[]; itemsFee: number; userId: string | null; discount?: number; couponCode?: string | null }
): Promise<{ error: string } | { orderId: string; total: number }> {
  const { subtotal, discount, fee, total } = finalTotals(data.items, data.discount ?? 0, data.itemsFee);
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
  const totals = finalTotals(priced.items, coupon?.discount ?? 0, priced.fee);
  if (totals.total <= 0) {
    const prep = await insertPendingOrder(svc, {
      ...parsed.data, items: priced.items, itemsFee: priced.fee,
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
    ...parsed.data, items: priced.items, itemsFee: priced.fee,
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
    ...parsed.data, items: priced.items, itemsFee: priced.fee,
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
    return { ok: false, error: detail ? `Não foi possível cobrar o cartão (${detail}).` : "Falha ao processar o cartão." };
  }
}

/** Preview de cupom no checkout. */
export async function previewCoupon(
  code: string,
  items: z.input<typeof ItemSchema>[]
): Promise<{ ok: true; discount: number } | { ok: false; error: string }> {
  const parsedItems = z.array(ItemSchema).safeParse(items);
  if (!parsedItems.success) return { ok: false, error: "Itens inválidos" };
  let svc: Svc;
  try { svc = await createServiceClient(); } catch { return { ok: false, error: "Indisponível" }; }
  const res = await couponDiscount(svc, code, parsedItems.data);
  if (!res) return { ok: false, error: "Informe um cupom." };
  if ("error" in res) return { ok: false, error: res.error };
  return { ok: true, discount: res.discount };
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
