"use server";

import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

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
  paymentMethod: z.enum(["pix", "card"]),
  items: z.array(ItemSchema).min(1, "Carrinho vazio"),
});

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createOrder(
  input: z.input<typeof OrderSchema>
): Promise<CreateOrderResult> {
  const parsed = OrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { buyerName, buyerEmail, buyerCpf, paymentMethod, items } = parsed.data;

  // Totais calculados no servidor
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;

  // Vincula ao usuário logado, se houver
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  // Escrita server-side (service role bypassa RLS)
  let svc;
  try {
    svc = await createServiceClient();
  } catch {
    return { ok: false, error: "Pagamento indisponível no momento." };
  }

  const { data: order, error: orderErr } = await svc
    .from("orders")
    .insert({
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_cpf: buyerCpf || null,
      payment_method: paymentMethod,
      status: "paid", // mock: pagamento aprovado
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
    // rollback simples do pedido
    await svc.from("orders").delete().eq("id", order.id);
    return { ok: false, error: itemsErr.message };
  }

  return { ok: true, orderId: order.id };
}
