import { randomBytes } from "crypto";
import QRCode from "qrcode";
import type { createServiceClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";
import { sendEmail, isMailerConfigured, escapeHtml as esc, type MailAttachment } from "@/lib/mailer";

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

/** Reserva ATÔMICA de estoque dos lotes do pedido (RPC com guarda de capacity).
 *  Retorna `true` se ESGOTOU (algum lote estourou) — nesse caso já desfaz o que
 *  reservou deste pedido, pra quem chamou tratar (estorno). */
async function reserveStock(svc: Svc, orderId: string): Promise<boolean> {
  const { data: its } = await svc
    .from("order_items")
    .select("tier_id, quantity")
    .eq("order_id", orderId);
  const feitos: { tierId: string; qty: number }[] = [];
  for (const it of its ?? []) {
    if (!it.tier_id) continue;
    const { data: ok } = await svc.rpc("reserve_tier_stock", { p_tier_id: it.tier_id, p_qty: it.quantity });
    if (ok === false) {
      // desfaz o que já reservou deste pedido (qty negativo libera)
      for (const f of feitos) await svc.rpc("reserve_tier_stock", { p_tier_id: f.tierId, p_qty: -f.qty });
      return true;
    }
    feitos.push({ tierId: it.tier_id, qty: it.quantity });
  }
  return false;
}

/** Estorna um pedido que estourou a capacidade no momento do pagamento (corrida
 *  no último ingresso). Devolve o dinheiro e cancela — nunca oversell silencioso. */
async function refundOversold(svc: Svc, orderId: string) {
  const { data: o } = await svc.from("orders").select("payment_id").eq("id", orderId).single();
  try {
    if (o?.payment_id) await getPaymentProvider().refund(o.payment_id);
  } catch {
    /* estorno pode ser retentado pelo admin; segue cancelando */
  }
  await svc.from("orders").update({ status: "refunded" }).eq("id", orderId);
  await cancelTickets(svc, orderId);
  await releaseSeats(svc, orderId);
  await sendRefundEmail(svc, orderId);
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
    .select("code, event_title, tier_name, seat_label")
    .eq("order_id", orderId);

  const items = (order.order_items ?? []) as { event_title: string; tier_name: string; quantity: number }[];
  const lista = (tickets ?? []) as { code: string; event_title: string; tier_name: string; seat_label: string | null }[];

  // Paleta Cartaz de Show: papel #FAF5EC · tinta #141210 · sol #E8481F
  // Resumo do que foi comprado
  const rows = items
    .map((i) => `<tr>
      <td style="padding:6px 0;color:#141210;font-weight:bold;text-transform:uppercase;font-size:14px">${esc(i.event_title)}<br>
        <span style="font-weight:normal;text-transform:none;color:rgba(20,18,16,.6);font-size:13px">${esc(i.tier_name)} × ${i.quantity}</span></td>
    </tr>`)
    .join("");

  // Um QR por ingresso, embutido via CID (renderiza inline no Gmail/Outlook) + anexo PNG
  const attachments: MailAttachment[] = [];
  const ingressos: string[] = [];
  for (const t of lista) {
    let cid: string | null = null;
    try {
      const buf = await QRCode.toBuffer(t.code, { margin: 1, width: 320, color: { dark: "#141210", light: "#ffffff" } });
      cid = `qr-${t.code}`;
      attachments.push({ filename: `ingresso-${t.code}.png`, content: buf, cid, contentType: "image/png" });
    } catch {
      /* sem QR: mostra só o código */
    }
    ingressos.push(`
      <div style="border:2px solid #141210;border-radius:14px;background:#fff;overflow:hidden;margin-top:16px">
        <div style="padding:18px;text-align:center">
          <p style="margin:0 0 12px;color:#C93A15;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Elleva Tickets</p>
          ${cid ? `<img src="cid:${cid}" alt="QR do ingresso" width="184" height="184" style="display:block;margin:0 auto;border:1px solid #eee" />` : ""}
          <p style="margin:14px 0 0;color:#141210;font-weight:bold;font-size:15px;text-transform:uppercase">${esc(t.event_title)}</p>
          <p style="margin:3px 0 0;color:rgba(20,18,16,.6);font-size:13px">${esc(t.tier_name)}${t.seat_label ? ` · ${esc(t.seat_label)}` : ""}</p>
          <p style="margin:10px 0 0;color:#141210;font-size:13px;font-weight:bold;letter-spacing:2px">${esc(t.code)}</p>
        </div>
      </div>`);
  }

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;background:#FAF5EC">
    <p style="margin:0;color:#C93A15;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Pagamento aprovado</p>
    <h1 style="margin:6px 0 0;color:#141210;font-size:30px;line-height:1;text-transform:uppercase;font-weight:900">Lugar garantido!</h1>
    <p style="color:#141210;font-size:15px;margin:14px 0 0">${esc(order.buyer_name)}, seu ingresso chegou. Apresente o QR code na entrada.</p>

    ${ingressos.join("")}

    <!-- resumo da compra -->
    <div style="margin-top:22px;border:1px solid rgba(20,18,16,.15);border-radius:12px;background:#fff;padding:14px 18px">
      <p style="margin:0 0 6px;color:#C93A15;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Sua compra</p>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px">
        <tr>
          <td style="padding-top:8px;border-top:1px dashed rgba(20,18,16,.2);color:rgba(20,18,16,.6);font-size:11px;letter-spacing:2px;text-transform:uppercase">Total pago</td>
          <td style="padding-top:8px;border-top:1px dashed rgba(20,18,16,.2);text-align:right;color:#141210;font-size:20px;font-weight:900">R$ ${Number(order.total).toLocaleString("pt-BR")}</td>
        </tr>
      </table>
    </div>

    <a href="${APP_URL}/conta" style="display:inline-block;margin-top:22px;background:#E8481F;color:#141210;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:9999px;font-size:15px">Ver meus ingressos</a>
    <p style="color:rgba(20,18,16,.6);font-size:12px;margin-top:20px;line-height:1.5">
      O QR também fica na sua conta Elleva. Leve um documento com foto — o nome e o CPF do comprador podem ser conferidos na entrada.
    </p>
  </div>`;

  try {
    await sendEmail({
      to: order.buyer_email,
      subject: "Lugar garantido! Seu ingresso chegou — Elleva Tickets",
      html,
      attachments,
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
    // libera de forma atômica (qty negativo)
    await svc.rpc("reserve_tier_stock", { p_tier_id: it.tier_id, p_qty: -it.quantity });
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
    <p style="color:#141210;font-size:15px">Olá, ${esc(order.buyer_name)}. Seu pedido foi <strong>reembolsado</strong>.</p>
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

/** E-mail avisando quem RECEBEU um ingresso transferido (com o QR do novo código). */
export async function sendTransferEmail(svc: Svc, ticketId: string) {
  if (!isMailerConfigured()) return;
  const { data: t } = await svc
    .from("tickets")
    .select("code, event_title, tier_name, seat_label, transfer_email")
    .eq("id", ticketId)
    .single();
  if (!t?.transfer_email) return;

  const attachments: MailAttachment[] = [];
  let qrImg = "";
  try {
    const buf = await QRCode.toBuffer(t.code, { margin: 1, width: 320, color: { dark: "#141210", light: "#ffffff" } });
    const cid = `qr-${t.code}`;
    attachments.push({ filename: `ingresso-${t.code}.png`, content: buf, cid, contentType: "image/png" });
    qrImg = `<img src="cid:${cid}" alt="QR do ingresso" width="184" height="184" style="display:block;margin:0 auto;border:1px solid #eee" />`;
  } catch {
    /* sem QR: mostra só o código */
  }

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;background:#FAF5EC">
    <p style="margin:0;color:#C93A15;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Você recebeu um ingresso</p>
    <h1 style="margin:6px 0 0;color:#141210;font-size:28px;line-height:1;text-transform:uppercase;font-weight:900">É seu agora!</h1>
    <p style="color:#141210;font-size:15px;margin:14px 0 0">Alguém transferiu um ingresso pra você na Elleva. Apresente o QR abaixo na entrada — ele fica também na sua conta ao entrar com este e-mail.</p>
    <div style="border:2px solid #141210;border-radius:14px;background:#fff;overflow:hidden;margin-top:16px">
      <div style="padding:18px;text-align:center">
        <p style="margin:0 0 12px;color:#C93A15;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Elleva Tickets</p>
        ${qrImg}
        <p style="margin:14px 0 0;color:#141210;font-weight:bold;font-size:15px;text-transform:uppercase">${esc(t.event_title)}</p>
        <p style="margin:3px 0 0;color:rgba(20,18,16,.6);font-size:13px">${esc(t.tier_name)}${t.seat_label ? ` · ${esc(t.seat_label)}` : ""}</p>
        <p style="margin:10px 0 0;color:#141210;font-size:13px;font-weight:bold;letter-spacing:2px">${esc(t.code)}</p>
      </div>
    </div>
    <a href="${APP_URL}/conta" style="display:inline-block;margin-top:22px;background:#E8481F;color:#141210;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:9999px;font-size:15px">Ver na minha conta</a>
  </div>`;

  try {
    await sendEmail({ to: t.transfer_email, subject: "Você recebeu um ingresso — Elleva Tickets", html, attachments });
  } catch {
    /* e-mail não deve quebrar a transferência */
  }
}

/** E-mail de lembrete de evento. */
export async function sendReminderEmail(to: string, name: string, eventTitle: string, when: string) {
  if (!isMailerConfigured()) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF5EC">
    <h1 style="font-weight:900;text-transform:uppercase;color:#141210;font-size:24px;margin:0 0 4px">Elleva <span style="color:#E8481F">Tickets</span></h1>
    <p style="color:#141210;font-size:15px">Olá, ${esc(name)}! Seu evento está chegando. 🎉</p>
    <div style="background:#fff;border:1px solid #141210;border-radius:14px;padding:20px;margin-top:16px">
      <p style="font-weight:900;text-transform:uppercase;font-size:18px;color:#141210;margin:0">${esc(eventTitle)}</p>
      <p style="color:rgba(20,18,16,.6);font-size:14px;margin:6px 0 0">${esc(when)}</p>
    </div>
    <a href="${appUrl}/conta" style="display:inline-block;margin-top:20px;background:#E8481F;color:#141210;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:9999px">Ver meus ingressos</a>
  </div>`;
  try {
    await sendEmail({ to, subject: `Lembrete: ${eventTitle} — Elleva Tickets`, html });
  } catch { /* ignore */ }
}

/** Estorna/cancela UM pedido, iniciado por nós (cancelamento de evento ou pelo
 *  admin). Diferente de markOrderRefunded (webhook, onde o gateway JÁ estornou),
 *  aqui somos nós que pedimos o estorno ao gateway primeiro. Idempotente:
 *  - pending  → cancela e libera assentos (não houve cobrança).
 *  - paid     → estorna no gateway; só então reverte local (markOrderRefunded).
 *               Se o gateway falhar, NÃO marca refunded (o dinheiro não voltou);
 *               devolve 'failed' pra quem chamou tratar/retentar.
 *  - refunded/cancelled → no-op ('already'). */
export type RefundAction = "refunded" | "cancelled_pending" | "already" | "failed";
export async function refundOrder(svc: Svc, orderId: string): Promise<{ action: RefundAction; error?: string }> {
  const { data: o } = await svc
    .from("orders")
    .select("status, payment_id, payment_provider")
    .eq("id", orderId)
    .single();
  if (!o) return { action: "failed", error: "Pedido não encontrado." };
  if (o.status === "refunded" || o.status === "cancelled") return { action: "already" };
  if (o.status === "pending") {
    await svc.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
    await releaseSeats(svc, orderId);
    return { action: "cancelled_pending" };
  }
  // paid: estorna no provedor que processou ANTES de reverter localmente
  const provider = getPaymentProvider();
  if (o.payment_id && o.payment_provider === provider.id) {
    try {
      await provider.refund(o.payment_id as string);
    } catch (e) {
      return { action: "failed", error: e instanceof Error ? e.message : "Falha ao estornar no provedor." };
    }
  }
  const r = await markOrderRefunded(svc, orderId);
  return r.ok ? { action: "refunded" } : { action: "already" };
}

/** Reverte um pedido cujo pagamento foi ESTORNADO no gateway (refund/chargeback
 *  avisado por webhook). ATÔMICO e idempotente: só quem flipar paid→refunded age.
 *  NÃO chama provider.refund — o dinheiro já voltou no gateway; aqui só
 *  sincronizamos o nosso lado (cancela ingressos, devolve estoque, avisa).
 *  Ao virar 'refunded', a venda sai sozinha do GMV/saldo (o financeiro só conta
 *  status='paid'). */
export async function markOrderRefunded(svc: Svc, orderId: string): Promise<{ ok: boolean }> {
  const { data: claimed } = await svc
    .from("orders")
    .update({ status: "refunded" })
    .eq("id", orderId)
    .eq("status", "paid")
    .select("id");
  if (!claimed || claimed.length === 0) return { ok: false }; // não estava pago (ou já revertido)
  await cancelTickets(svc, orderId);
  await reverseSold(svc, orderId);
  await sendRefundEmail(svc, orderId);
  return { ok: true };
}

/** Marca pedido como pago. ATÔMICO e idempotente: só o PRIMEIRO caller
 *  (retorno síncrono OU webhook) vence a transição pending→paid, então
 *  estoque/cupom/ingressos rodam exatamente uma vez. */
export async function markOrderPaid(svc: Svc, orderId: string): Promise<{ ok: boolean }> {
  // gate: só quem flipar pending→paid segue (where status='pending')
  const { data: claimed } = await svc
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("coupon_code");
  if (!claimed || claimed.length === 0) {
    // não fomos nós que flipamos — reporta o resultado final ao caller síncrono
    const { data: cur } = await svc.from("orders").select("status").eq("id", orderId).single();
    return { ok: cur?.status === "paid" };
  }

  const couponCode = claimed[0].coupon_code as string | null;

  // estoque atômico com guarda de capacidade; se estourou (corrida no último
  // ingresso), estorna em vez de vender além da lotação
  const esgotou = await reserveStock(svc, orderId);
  if (esgotou) {
    await refundOversold(svc, orderId);
    return { ok: false };
  }

  // uso de cupom de forma atômica (respeita max_uses)
  if (couponCode) await svc.rpc("increment_coupon_use", { p_code: couponCode });

  await sellSeats(svc, orderId);
  await maybeMarkSoldOut(svc, orderId);
  await generateTickets(svc, orderId);
  await sendConfirmationEmail(svc, orderId);
  return { ok: true };
}
