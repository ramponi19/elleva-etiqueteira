import { randomBytes } from "crypto";
import type { createServiceClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";

type Svc = Awaited<ReturnType<typeof createServiceClient>>;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function ticketCode() {
  return "ELV-" + randomBytes(5).toString("hex").toUpperCase();
}

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

/** Gera 1 ingresso por unidade comprada (idempotente). */
export async function generateTickets(svc: Svc, orderId: string) {
  const { count } = await svc
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("order_id", orderId);
  if ((count ?? 0) > 0) return; // já gerados

  const { data: its } = await svc
    .from("order_items")
    .select("event_id, event_title, tier_name, quantity")
    .eq("order_id", orderId);

  const rows: {
    order_id: string;
    event_id: string | null;
    code: string;
    event_title: string;
    tier_name: string;
  }[] = [];
  for (const it of its ?? []) {
    for (let i = 0; i < it.quantity; i++) {
      rows.push({
        order_id: orderId,
        event_id: it.event_id,
        code: ticketCode(),
        event_title: it.event_title,
        tier_name: it.tier_name,
      });
    }
  }
  if (rows.length) await svc.from("tickets").insert(rows);
}

/** E-mail de confirmação (silencioso se Resend não estiver configurado). */
export async function sendConfirmationEmail(svc: Svc, orderId: string) {
  const resend = getResend();
  if (!resend) return;

  const { data: order } = await svc
    .from("orders")
    .select("buyer_name, buyer_email, total, order_items(event_title, tier_name, quantity)")
    .eq("id", orderId)
    .single();
  if (!order?.buyer_email) return;

  const items = (order.order_items ?? []) as { event_title: string; tier_name: string; quantity: number }[];
  const rows = items
    .map((i) => `<tr><td style="padding:6px 0;color:#162332">${i.event_title} — ${i.tier_name}</td><td style="padding:6px 0;text-align:right;color:#73829A">×${i.quantity}</td></tr>`)
    .join("");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#F6F3EB">
    <h1 style="font-family:Georgia,serif;color:#162332;font-size:24px;margin:0 0 4px">Elleva <span style="color:#C6A86A">Tickets</span></h1>
    <p style="color:#4A5A70;font-size:15px">Olá, ${order.buyer_name}! Sua compra foi confirmada. 🎉</p>
    <div style="background:#fff;border:1px solid #D2CBB8;border-radius:14px;padding:20px;margin-top:16px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
      <div style="border-top:1px solid #ECE9E0;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between">
        <strong style="color:#162332">Total</strong>
        <strong style="color:#162332">R$ ${Number(order.total).toLocaleString("pt-BR")}</strong>
      </div>
    </div>
    <a href="${APP_URL}/conta" style="display:inline-block;margin-top:20px;background:#C6A86A;color:#0E1824;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:9999px">Ver meus ingressos</a>
    <p style="color:#A2ADBE;font-size:12px;margin-top:24px">Os ingressos com QR code estão disponíveis na sua conta Elleva.</p>
  </div>`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.buyer_email,
      subject: "Sua compra foi confirmada — Elleva Tickets",
      html,
    });
  } catch {
    /* e-mail não deve quebrar o fluxo de pagamento */
  }
}

/** Marca como sold_out os eventos do pedido cujos lotes (todos limitados) se esgotaram. */
export async function maybeMarkSoldOut(svc: Svc, orderId: string) {
  const { data: its } = await svc
    .from("order_items")
    .select("event_id")
    .eq("order_id", orderId);
  const eventIds = [...new Set((its ?? []).map((i) => i.event_id).filter(Boolean))] as string[];

  for (const eventId of eventIds) {
    const { data: tiers } = await svc
      .from("ticket_tiers")
      .select("capacity, sold")
      .eq("event_id", eventId);
    if (!tiers?.length) continue;
    const hasUnlimited = tiers.some((t) => t.capacity == null);
    const allSoldOut = tiers.every((t) => t.capacity != null && (t.sold ?? 0) >= t.capacity);
    if (!hasUnlimited && allSoldOut) {
      await svc.from("events").update({ status: "sold_out" }).eq("id", eventId);
    }
  }
}

/** Marca pedido como pago (idempotente): estoque + ingressos + e-mail. */
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
  await maybeMarkSoldOut(svc, orderId);
  await generateTickets(svc, orderId);
  await sendConfirmationEmail(svc, orderId);
}
