"use server";

import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getMpPayment } from "@/lib/mercadopago";
import { markOrderPaid } from "@/lib/orders-helpers";

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const ItemSchema = z.object({
  eventId: z.string(),
  eventTitle: z.string(),
  tierId: z.string(),
  tierName: z.string(),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
});

const BaseSchema = z.object({
  buyerName: z.string().min(1, "Informe seu nome"),
  buyerEmail: z.string().email("E-mail inválido"),
  buyerCpf: z.string().optional(),
  couponCode: z.string().optional(),
  items: z.array(ItemSchema).min(1, "Carrinho vazio"),
});

type Items = z.infer<typeof ItemSchema>[];
type Svc = Awaited<ReturnType<typeof createServiceClient>>;

function subtotalOf(items: Items) {
  return items.reduce((a, i) => a + i.price * i.qty, 0);
}

function finalTotals(items: Items, discount: number) {
  const subtotal = subtotalOf(items);
  const d = Math.min(discount, subtotal);
  const base = subtotal - d;
  const fee = Math.round(base * 0.1);
  return { subtotal, discount: d, fee, total: base + fee };
}

/** Valida um cupom e retorna o desconto sobre o subtotal (0 se inválido). */
async function couponDiscount(
  svc: Svc,
  code: string | undefined,
  subtotal: number
): Promise<{ discount: number; code: string } | { error: string } | null> {
  if (!code || !code.trim()) return null;
  const norm = code.trim().toUpperCase();
  const { data: c } = await svc
    .from("coupons")
    .select("code, discount_type, discount_value, max_uses, used_count, active, expires_at")
    .eq("code", norm)
    .single();
  if (!c || !c.active) return { error: "Cupom inválido." };
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return { error: "Cupom expirado." };
  if (c.max_uses != null && c.used_count >= c.max_uses) return { error: "Cupom esgotado." };

  const raw = c.discount_type === "percent"
    ? Math.round((subtotal * Number(c.discount_value)) / 100)
    : Number(c.discount_value);
  const discount = Math.min(raw, subtotal);
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
  data: { buyerName: string; buyerEmail: string; buyerCpf?: string; method: "pix" | "card"; provider: string; items: Items; userId: string | null; discount?: number; couponCode?: string | null }
): Promise<{ error: string } | { orderId: string; total: number }> {
  const { subtotal, discount, fee, total } = finalTotals(data.items, data.discount ?? 0);
  const { data: order, error } = await svc
    .from("orders")
    .insert({
      buyer_name: data.buyerName,
      buyer_email: data.buyerEmail,
      buyer_cpf: data.buyerCpf || null,
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
    }))
  );
  if (itemsErr) {
    await svc.from("orders").delete().eq("id", order.id);
    return { error: itemsErr.message };
  }
  return { orderId: order.id as string, total };
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

  const stockErr = await checkStock(svc, parsed.data.items);
  if (stockErr) return { ok: false, error: stockErr };

  const coupon = await couponDiscount(svc, parsed.data.couponCode, subtotalOf(parsed.data.items));
  if (coupon && "error" in coupon) return { ok: false, error: coupon.error };

  const mp = getMpPayment();
  const prep = await insertPendingOrder(svc, {
    ...parsed.data, method: "pix", provider: mp ? "mercadopago" : "mock", userId: await currentUserId(),
    discount: coupon?.discount ?? 0, couponCode: coupon?.code ?? null,
  });
  if ("error" in prep) return { ok: false, error: prep.error };

  if (!mp) {
    await markOrderPaid(svc, prep.orderId);
    return { ok: true, orderId: prep.orderId, paid: true };
  }

  try {
    const [firstName, ...rest] = parsed.data.buyerName.trim().split(" ");
    const exp = pixExpiration(PIX_TTL_MIN);
    const payment = await mp.create({
      body: {
        transaction_amount: prep.total,
        description: `Elleva Tickets — pedido ${prep.orderId}`,
        payment_method_id: "pix",
        date_of_expiration: exp.mp,
        external_reference: prep.orderId,
        notification_url: `${APP_URL}/api/webhooks/mercadopago`,
        payer: {
          email: parsed.data.buyerEmail,
          first_name: firstName,
          last_name: rest.join(" ") || undefined,
          identification: parsed.data.buyerCpf ? { type: "CPF", number: parsed.data.buyerCpf.replace(/\D/g, "") } : undefined,
        },
      },
    });
    const tx = payment.point_of_interaction?.transaction_data;
    await svc.from("orders").update({
      payment_id: String(payment.id),
      pix_qr_base64: tx?.qr_code_base64 ?? "",
      pix_copy_paste: tx?.qr_code ?? "",
      expires_at: exp.iso,
    }).eq("id", prep.orderId);
    return { ok: true, orderId: prep.orderId, paid: false, pix: { qrBase64: tx?.qr_code_base64 ?? "", copyPaste: tx?.qr_code ?? "" }, total: prep.total, expiresAt: exp.iso };
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
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createCardOrder(input: z.input<typeof CardSchema>): Promise<CardResult> {
  const parsed = CardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const mp = getMpPayment();
  if (!mp) return { ok: false, error: "Pagamento por cartão indisponível." };

  let svc: Svc;
  try { svc = await createServiceClient(); } catch { return { ok: false, error: "Pagamento indisponível." }; }

  const stockErr = await checkStock(svc, parsed.data.items);
  if (stockErr) return { ok: false, error: stockErr };

  const coupon = await couponDiscount(svc, parsed.data.couponCode, subtotalOf(parsed.data.items));
  if (coupon && "error" in coupon) return { ok: false, error: coupon.error };

  const prep = await insertPendingOrder(svc, {
    ...parsed.data, method: "card", provider: "mercadopago", userId: await currentUserId(),
    discount: coupon?.discount ?? 0, couponCode: coupon?.code ?? null,
  });
  if ("error" in prep) return { ok: false, error: prep.error };

  try {
    const payment = await mp.create({
      body: {
        transaction_amount: prep.total,
        token: parsed.data.token,
        payment_method_id: parsed.data.paymentMethodId,
        installments: parsed.data.installments,
        description: `Elleva Tickets — pedido ${prep.orderId}`,
        external_reference: prep.orderId,
        notification_url: `${APP_URL}/api/webhooks/mercadopago`,
        payer: {
          email: parsed.data.buyerEmail,
          identification: parsed.data.buyerCpf ? { type: "CPF", number: parsed.data.buyerCpf.replace(/\D/g, "") } : undefined,
        },
      },
    });

    await svc.from("orders").update({ payment_id: String(payment.id) }).eq("id", prep.orderId);

    if (payment.status === "approved") {
      await markOrderPaid(svc, prep.orderId);
      return { ok: true, orderId: prep.orderId };
    }
    if (payment.status === "in_process" || payment.status === "pending") {
      // em análise — webhook confirma depois
      return { ok: true, orderId: prep.orderId };
    }
    // rejeitado
    await svc.from("orders").update({ status: "cancelled" }).eq("id", prep.orderId);
    return { ok: false, error: "Pagamento recusado pelo emissor do cartão." };
  } catch (e) {
    await svc.from("orders").update({ status: "cancelled" }).eq("id", prep.orderId);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao processar o cartão" };
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
  const res = await couponDiscount(svc, code, subtotalOf(parsedItems.data));
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
