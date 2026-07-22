import { randomBytes } from "crypto";
import type { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, isMailerConfigured } from "@/lib/mailer";

type Svc = Awaited<ReturnType<typeof createServiceClient>>;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function ticketCode() {
  return "ELV-" + randomBytes(5).toString("hex").toUpperCase();
}

// ============================================================
// Assentos marcados
// ============================================================

/** Reserva assentos para um pedido (atômico). Só pega os disponíveis
 *  (ou com reserva expirada). Se não conseguir todos, desfaz e falha. */
export async function claimSeats(
  svc: Svc,
  orderId: string,
  seatIds: string[],
  holdMinutes = 30
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!seatIds.length) return { ok: true };
  const nowIso = new Date().toISOString();
  const heldUntil = new Date(Date.now() + holdMinutes * 60000).toISOString();
  const { data, error } = await svc
    .from("seats")
    .update({ status: "held", order_id: orderId, held_until: heldUntil })
    .in("id", seatIds)
    .or(`status.eq.available,and(status.eq.held,held_until.lt.${nowIso})`)
    .select("id");
  if (error) return { ok: false, error: "Não foi possível reservar os assentos." };
  if ((data?.length ?? 0) < seatIds.length) {
    // conflito: libera o que porventura pegamos e avisa
    await svc.from("seats").update({ status: "available", order_id: null, held_until: null }).eq("order_id", orderId);
    return { ok: false, error: "Um dos assentos escolhidos acabou de ser reservado. Escolha outro." };
  }
  return { ok: true };
}

/** Confirma a venda dos assentos do pedido (held -> sold). */
export async function sellSeats(svc: Svc, orderId: string) {
  await svc.from("seats").update({ status: "sold", held_until: null }).eq("order_id", orderId);
}

/** Libera os assentos do pedido (volta a disponível). */
export async function releaseSeats(svc: Svc, orderId: string) {
  await svc.from("seats").update({ status: "available", order_id: null, held_until: null }).eq("order_id", orderId);
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
    .select("event_id, event_title, tier_name, quantity, is_addon, seats(label)")
    .eq("order_id", orderId);

  const rows: {
    order_id: string;
    event_id: string | null;
    code: string;
    event_title: string;
    tier_name: string;
    seat_label: string | null;
  }[] = [];
  for (const it of its ?? []) {
    if (it.is_addon) continue; // add-on/produto não gera ingresso com QR
    const seat = it.seats as unknown as { label: string } | null;
    for (let i = 0; i < it.quantity; i++) {
      rows.push({
        order_id: orderId,
        event_id: it.event_id,
        code: ticketCode(),
        event_title: it.event_title,
        tier_name: it.tier_name,
        seat_label: seat?.label ?? null,
      });
    }
  }
  if (rows.length) await svc.from("tickets").insert(rows);
}

/** E-mail de confirmação com o visual do ingresso (spec Fase C).
 *  Silencioso se o SMTP não estiver configurado. */
export async function sendConfirmationEmail(svc: Svc, orderId: string) {
  if (!isMailerConfigured()) return;

  const { data: order } = await svc
    .from("orders")
    .select("buyer_name, buyer_email, total, order_items(event_title, tier_name, quantity)")
    .eq("id", orderId)
    .single();
  if (!order?.buyer_email) return;

  const { data: tickets } = await svc
    .from("tickets")
    .select("code, event_title, tier_name")
    .eq("order_id", orderId);

  const items = (order.order_items ?? []) as { event_title: string; tier_name: string; quantity: number }[];
  // Paleta Cartaz de Show: papel #FAF5EC · tinta #141210 · sol #E8481F
  const rows = items
    .map((i) => `<tr>
      <td style="padding:8px 0;color:#141210;font-weight:bold;text-transform:uppercase;font-size:15px">${i.event_title}<br>
        <span style="font-weight:normal;text-transform:none;color:rgba(20,18,16,.6);font-size:13px">${i.tier_name} × ${i.quantity}</span></td>
    </tr>`)
    .join("");

  const codes = (tickets ?? [])
    .map((t) => `<tr>
      <td style="padding:6px 0;color:#141210;font-size:14px;font-weight:bold;letter-spacing:2px">${t.code}</td>
      <td style="padding:6px 0;text-align:right;color:rgba(20,18,16,.6);font-size:12px">${t.tier_name}</td>
    </tr>`)
    .join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;background:#FAF5EC">
    <p style="margin:0;color:#C93A15;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Pix aprovado</p>
    <h1 style="margin:6px 0 0;color:#141210;font-size:30px;line-height:1;text-transform:uppercase;font-weight:900">Lugar garantido!</h1>
    <p style="color:#141210;font-size:15px;margin:14px 0 0">${order.buyer_name}, seu ingresso chegou. A gente se vê lá.</p>

    <!-- o ingresso -->
    <div style="margin-top:22px;border:2px solid #141210;border-radius:14px;background:#fff;overflow:hidden">
      <div style="padding:18px 20px">
        <p style="margin:0 0 10px;color:#C93A15;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Elleva Tickets</p>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
      </div>
      <div style="border-top:2px dashed #141210;padding:14px 20px;background:#F3ECDF">
        ${codes ? `<table style="width:100%;border-collapse:collapse">${codes}</table>` : ""}
        <table style="width:100%;border-collapse:collapse;margin-top:8px">
          <tr>
            <td style="color:rgba(20,18,16,.6);font-size:11px;letter-spacing:2px;text-transform:uppercase">Total pago</td>
            <td style="text-align:right;color:#141210;font-size:20px;font-weight:900">R$ ${Number(order.total).toLocaleString("pt-BR")}</td>
          </tr>
        </table>
      </div>
    </div>

    <a href="${APP_URL}/conta" style="display:inline-block;margin-top:22px;background:#E8481F;color:#141210;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:9999px;font-size:15px">Ver meus ingressos</a>
    <p style="color:rgba(20,18,16,.6);font-size:12px;margin-top:20px;line-height:1.5">
      O QR code de cada ingresso está na sua conta Elleva — é ele que entra.
      Guarda este e-mail: os códigos acima também valem na portaria.
    </p>
  </div>`;

  try {
    await sendEmail({
      to: order.buyer_email,
      subject: "Lugar garantido! Seu ingresso chegou — Elleva Tickets",
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

/** Reverte estoque (decrementa sold) dos itens do pedido. */
export async function reverseSold(svc: Svc, orderId: string) {
  const { data: its } = await svc
    .from("order_items")
    .select("tier_id, quantity, event_id")
    .eq("order_id", orderId);
  const eventIds = new Set<string>();
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
        .update({ sold: Math.max(0, (tier.sold ?? 0) - it.quantity) })
        .eq("id", it.tier_id);
    }
    if (it.event_id) eventIds.add(it.event_id);
  }
  // libera eventos que estavam esgotados
  for (const id of eventIds) {
    await svc.from("events").update({ status: "published" }).eq("id", id).eq("status", "sold_out");
  }
  await releaseSeats(svc, orderId);
}

/** Cancela os ingressos do pedido e libera os assentos. */
export async function cancelTickets(svc: Svc, orderId: string) {
  await svc.from("tickets").update({ status: "cancelled" }).eq("order_id", orderId);
  await releaseSeats(svc, orderId);
}

/** E-mail de reembolso (silencioso se o SMTP não configurado). */
export async function sendRefundEmail(svc: Svc, orderId: string) {
  if (!isMailerConfigured()) return;
  const { data: order } = await svc
    .from("orders")
    .select("buyer_name, buyer_email, total")
    .eq("id", orderId)
    .single();
  if (!order?.buyer_email) return;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF5EC">
    <h1 style="font-weight:900;text-transform:uppercase;color:#141210;font-size:24px;margin:0 0 4px">Elleva <span style="color:#E8481F">Tickets</span></h1>
    <p style="color:#141210;font-size:15px">Olá, ${order.buyer_name}. Seu pedido foi <strong>reembolsado</strong>.</p>
    <div style="background:#fff;border:1px solid #141210;border-radius:14px;padding:20px;margin-top:16px">
      <p style="margin:0;color:#141210">Valor reembolsado: <strong>R$ ${Number(order.total).toLocaleString("pt-BR")}</strong></p>
      <p style="margin:8px 0 0;color:rgba(20,18,16,.6);font-size:13px">O estorno pode levar alguns dias para aparecer, conforme o meio de pagamento. Os ingressos deste pedido foram cancelados.</p>
    </div>
  </div>`;
  try {
    await sendEmail({
      to: order.buyer_email,
      subject: "Pedido reembolsado — Elleva Tickets",
      html,
    });
  } catch { /* não quebra o fluxo */ }
}

/** E-mail de lembrete de evento. */
export async function sendReminderEmail(to: string, name: string, eventTitle: string, when: string) {
  if (!isMailerConfigured()) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF5EC">
    <h1 style="font-weight:900;text-transform:uppercase;color:#141210;font-size:24px;margin:0 0 4px">Elleva <span style="color:#E8481F">Tickets</span></h1>
    <p style="color:#141210;font-size:15px">Olá, ${name}! Seu evento está chegando. 🎉</p>
    <div style="background:#fff;border:1px solid #141210;border-radius:14px;padding:20px;margin-top:16px">
      <p style="font-weight:900;text-transform:uppercase;font-size:18px;color:#141210;margin:0">${eventTitle}</p>
      <p style="color:rgba(20,18,16,.6);font-size:14px;margin:6px 0 0">${when}</p>
    </div>
    <a href="${appUrl}/conta" style="display:inline-block;margin-top:20px;background:#E8481F;color:#141210;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:9999px">Ver meus ingressos</a>
  </div>`;
  try {
    await sendEmail({ to, subject: `Lembrete: ${eventTitle} — Elleva Tickets`, html });
  } catch { /* ignore */ }
}

/** Marca pedido como pago (idempotente): estoque + ingressos + e-mail. */
export async function markOrderPaid(svc: Svc, orderId: string) {
  const { data: order } = await svc
    .from("orders")
    .select("status, coupon_code")
    .eq("id", orderId)
    .single();
  if (!order || order.status === "paid") return;

  await svc
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId);

  // contabiliza uso do cupom (apenas em pagamento confirmado)
  if (order.coupon_code) {
    const { data: c } = await svc
      .from("coupons")
      .select("used_count")
      .eq("code", order.coupon_code)
      .single();
    if (c) {
      await svc
        .from("coupons")
        .update({ used_count: (c.used_count ?? 0) + 1 })
        .eq("code", order.coupon_code);
    }
  }

  await bumpSold(svc, orderId);
  await sellSeats(svc, orderId);
  await maybeMarkSoldOut(svc, orderId);
  await generateTickets(svc, orderId);
  await sendConfirmationEmail(svc, orderId);
}
