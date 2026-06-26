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

const OrderSchema = z.object({
  buyerName: z.string().min(1, "Informe seu nome"),
  buyerEmail: z.string().email("E-mail inválido"),
  buyerCpf: z.string().optional(),
  items: z.array(ItemSchema).min(1, "Carrinho vazio"),
});

export type CreateOrderResult =
  | { ok: true; orderId: string; paid: true } // modo mock (sem MP)
  | { ok: true; orderId: string; paid: false; pix: { qrBase64: string; copyPaste: string }; total: number }
  | { ok: false; error: string };

export async function createOrder(
  input: z.input<typeof OrderSchema>
): Promise<CreateOrderResult> {
  const parsed = OrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { buyerName, buyerEmail, buyerCpf, items } = parsed.data;

  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  let svc;
  try {
    svc = await createServiceClient();
  } catch {
    return { ok: false, error: "Pagamento indisponível no momento." };
  }

  // Valida estoque (capacity - sold) por lote antes de criar o pedido
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
        return {
          ok: false,
          error:
            available === 0
              ? `"${tier.name}" está esgotado.`
              : `Restam apenas ${available} ingresso(s) de "${tier.name}".`,
        };
      }
    }
  }

  const mp = getMpPayment();

  // Cria o pedido como 'pending' (ou 'paid' direto no modo mock)
  const { data: order, error: orderErr } = await svc
    .from("orders")
    .insert({
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_cpf: buyerCpf || null,
      payment_method: "pix",
      payment_provider: mp ? "mercadopago" : "mock",
      status: "pending",
      subtotal,
      fee,
      total,
      user_id: user?.id ?? null,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return { ok: false, error: orderErr?.message ?? "Falha ao criar pedido" };
  }

  const { error: itemsErr } = await svc.from("order_items").insert(
    items.map((it) => ({
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
    return { ok: false, error: itemsErr.message };
  }

  // Sem Mercado Pago configurado → aprova na hora (mock): estoque + ingressos + e-mail
  if (!mp) {
    await markOrderPaid(svc, order.id);
    return { ok: true, orderId: order.id, paid: true };
  }

  // Cria pagamento Pix no Mercado Pago
  try {
    const [firstName, ...rest] = buyerName.trim().split(" ");
    const payment = await mp.create({
      body: {
        transaction_amount: total,
        description: `Elleva Tickets — pedido ${order.id}`,
        payment_method_id: "pix",
        external_reference: order.id,
        notification_url: `${APP_URL}/api/webhooks/mercadopago`,
        payer: {
          email: buyerEmail,
          first_name: firstName,
          last_name: rest.join(" ") || undefined,
          identification: buyerCpf
            ? { type: "CPF", number: buyerCpf.replace(/\D/g, "") }
            : undefined,
        },
      },
    });

    const tx = payment.point_of_interaction?.transaction_data;
    const qrBase64 = tx?.qr_code_base64 ?? "";
    const copyPaste = tx?.qr_code ?? "";

    await svc
      .from("orders")
      .update({
        payment_id: String(payment.id),
        pix_qr_base64: qrBase64,
        pix_copy_paste: copyPaste,
      })
      .eq("id", order.id);

    return { ok: true, orderId: order.id, paid: false, pix: { qrBase64, copyPaste }, total };
  } catch (e) {
    await svc.from("order_items").delete().eq("order_id", order.id);
    await svc.from("orders").delete().eq("id", order.id);
    const msg = e instanceof Error ? e.message : "Falha ao gerar o Pix";
    return { ok: false, error: msg };
  }
}

/** Polling do status do pedido (service role — pedido pode ser anônimo). */
export async function getOrderStatus(orderId: string): Promise<string | null> {
  try {
    const svc = await createServiceClient();
    const { data } = await svc.from("orders").select("status").eq("id", orderId).single();
    return (data?.status as string) ?? null;
  } catch {
    return null;
  }
}

