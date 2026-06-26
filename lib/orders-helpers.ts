import type { createServiceClient } from "@/lib/supabase/server";

type Svc = Awaited<ReturnType<typeof createServiceClient>>;

/** Incrementa ticket_tiers.sold conforme os itens do pedido. */
export async function bumpSold(svc: Svc, orderId: string) {
  const { data: its } = await svc
    .from("order_items")
    .select("tier_id, quantity")
    .eq("order_id", orderId);
  for (const it of its ?? []) {
    if (!it.tier_id) continue;
    const { data: tier } = await svc
      .from("ticket_tiers")
      .select("sold")
      .eq("id", it.tier_id)
      .single();
    if (tier) {
      await svc
        .from("ticket_tiers")
        .update({ sold: (tier.sold ?? 0) + it.quantity })
        .eq("id", it.tier_id);
    }
  }
}

/** Marca um pedido como pago (idempotente) e baixa o estoque. */
export async function markOrderPaid(svc: Svc, orderId: string) {
  const { data: order } = await svc
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();
  if (!order || order.status === "paid") return;
  await svc
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId);
  await bumpSold(svc, orderId);
}
