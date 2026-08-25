import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendReminderEmail, releaseSeats } from "@/lib/orders-helpers";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function fmtWhen(iso: string) {
  const p = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")} ${MONTHS[parseInt(g("month"), 10) - 1]} · ${g("hour")}:${g("minute")}`;
}

export async function GET(request: Request) {
  // proteção: Vercel Cron envia Authorization: Bearer <CRON_SECRET>.
  // Em produção é OBRIGATÓRIO (fail-closed): sem secret ou header errado, recusa.
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isProd = process.env.NODE_ENV === "production";
  if (isProd || secret) {
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const svc = await createServiceClient();
  const now = Date.now();
  const in48h = new Date(now + 48 * 3600000).toISOString();
  const nowIso = new Date(now).toISOString();

  // eventos nas próximas 48h ainda não lembrados
  const { data: events } = await svc
    .from("events")
    .select("id, title, starts_at")
    .eq("status", "published")
    .is("reminder_sent_at", null)
    .gte("starts_at", nowIso)
    .lte("starts_at", in48h);

  let sent = 0;
  let failed = 0;
  const PAGE = 1000;
  for (const ev of events ?? []) {
    // Compradores com pedido pago deste evento — PAGINADO: o PostgREST corta em
    // max-rows sem erro, então acima de ~1000 itens parte do público não recebia.
    const seen = new Set<string>();
    const when = fmtWhen(ev.starts_at);
    for (let from = 0; ; from += PAGE) {
      const { data: items, error } = await svc
        .from("order_items")
        .select("orders!inner(buyer_email, buyer_name, status)")
        .eq("event_id", ev.id)
        .eq("orders.status", "paid")
        .range(from, from + PAGE - 1);
      if (error) break;
      const lote = items ?? [];
      for (const it of lote) {
        const o = (Array.isArray(it.orders) ? it.orders[0] : it.orders) as { buyer_email: string; buyer_name: string } | undefined;
        if (!o?.buyer_email || seen.has(o.buyer_email)) continue;
        seen.add(o.buyer_email);
        // um destinatário que falha NÃO pode derrubar o restante da fila (antes
        // a exceção estourava a rota, ninguém mais recebia e o evento ficava sem
        // reminder_sent_at → na execução seguinte os primeiros recebiam de novo)
        try {
          await sendReminderEmail(o.buyer_email, o.buyer_name ?? "", ev.title, when);
          sent++;
        } catch {
          failed++;
        }
      }
      if (lote.length < PAGE) break;
    }
    await svc.from("events").update({ reminder_sent_at: new Date().toISOString() }).eq("id", ev.id);
  }

  // M9: Pix pendente que passou do prazo vira 'cancelled' e libera os assentos.
  // Sem isto, a pendência ficava eterna (a lista do admin acumulava e o número
  // de "pendentes" no financeiro nunca fechava). Só toca pendentes já vencidos.
  let expirados = 0;
  try {
    const { data: velhos } = await svc
      .from("orders")
      .select("id")
      .eq("status", "pending")
      .not("expires_at", "is", null)
      .lt("expires_at", nowIso);
    for (const o of velhos ?? []) {
      const { data: done } = await svc
        .from("orders").update({ status: "cancelled" }).eq("id", o.id).eq("status", "pending").select("id");
      if (done?.length) {
        await releaseSeats(svc, o.id as string);
        expirados++;
      }
    }
  } catch { /* faxina não pode derrubar o cron */ }

  // faxina das janelas antigas de rate limit (A7) — não deixa a tabela crescer
  await svc.rpc("rate_limit_gc").then(undefined, () => {});

  return NextResponse.json({ ok: true, events: events?.length ?? 0, emails: sent, falhas: failed, expirados });
}
