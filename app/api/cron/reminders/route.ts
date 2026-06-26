import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendReminderEmail } from "@/lib/orders-helpers";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function fmtWhen(iso: string) {
  const p = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")} ${MONTHS[parseInt(g("month"), 10) - 1]} · ${g("hour")}:${g("minute")}`;
}

export async function GET(request: Request) {
  // proteção: Vercel Cron envia Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
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
  for (const ev of events ?? []) {
    // compradores com pedido pago deste evento
    const { data: items } = await svc
      .from("order_items")
      .select("orders!inner(buyer_email, buyer_name, status)")
      .eq("event_id", ev.id)
      .eq("orders.status", "paid");

    const seen = new Set<string>();
    const when = fmtWhen(ev.starts_at);
    for (const it of items ?? []) {
      const o = (Array.isArray(it.orders) ? it.orders[0] : it.orders) as { buyer_email: string; buyer_name: string } | undefined;
      if (!o?.buyer_email || seen.has(o.buyer_email)) continue;
      seen.add(o.buyer_email);
      await sendReminderEmail(o.buyer_email, o.buyer_name ?? "", ev.title, when);
      sent++;
    }
    await svc.from("events").update({ reminder_sent_at: new Date().toISOString() }).eq("id", ev.id);
  }

  return NextResponse.json({ ok: true, events: events?.length ?? 0, emails: sent });
}
