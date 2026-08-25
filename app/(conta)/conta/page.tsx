import type { Metadata } from "next";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { IngressosTabs, type TicketView, type PendingOrder } from "@/components/elleva/ingressos-tabs";

export const metadata: Metadata = { title: "Meus ingressos" };

const naoExpirou = (iso: string | null) => !iso || new Date(iso).getTime() > Date.now();

type TicketRow = {
  id: string; code: string; event_title: string; tier_name: string; seat_label: string | null;
  status: string; created_at: string; order_id: string;
  events: { certificate_enabled?: boolean; starts_at?: string } | null;
  orders: { status?: string; paid_at?: string | null; created_at?: string } | null;
};

/** Monta o TicketView (com QR) e calcula a elegibilidade de reembolso.
 *  Em função de módulo (fora do componente) — o `Date.now()` do prazo não pode
 *  ficar no corpo do render (regra de pureza do React). */
async function montarTicket(t: TicketRow): Promise<TicketView> {
  const agora = Date.now();
  const ev = t.events;
  const ord = t.orders;
  // Reembolso self-service (CDC art. 49): pago, dentro de 7 dias e evento futuro.
  const base = ord?.paid_at ?? ord?.created_at ?? t.created_at;
  const dentroPrazo = base ? agora <= new Date(base).getTime() + 7 * 86400000 : false;
  const eventoFuturo = ev?.starts_at ? new Date(ev.starts_at).getTime() > agora : true;
  return {
    id: t.id,
    code: t.code,
    event_title: t.event_title,
    tier_name: t.seat_label ? `${t.tier_name} · ${t.seat_label}` : t.tier_name,
    status: t.status,
    certEligible: t.status === "used" && !!ev?.certificate_enabled,
    orderId: t.order_id,
    refundEligible: t.status === "valid" && ord?.status === "paid" && dentroPrazo && eventoFuturo,
    qr: await QRCode.toDataURL(t.code, { margin: 1, width: 220, color: { dark: "#141210", light: "#ffffff" } }),
  };
}

type PendingRow = {
  id: string;
  total: number;
  pix_copy_paste: string | null;
  expires_at: string | null;
  created_at: string;
  order_items: { event_title: string; tier_name: string; quantity: number }[] | null;
};

export default async function ContaOverview() {
  const supabase = await createClient();

  const [{ data: tickets }, { data: pend }] = await Promise.all([
    supabase
      .from("tickets")
      .select("id, code, event_title, tier_name, seat_label, status, created_at, order_id, events(certificate_enabled, starts_at), orders(status, paid_at, created_at)")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, total, pix_copy_paste, expires_at, created_at, order_items(event_title, tier_name, quantity)")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const withQr: TicketView[] = await Promise.all(((tickets ?? []) as unknown as TicketRow[]).map(montarTicket));

  const pendentes: PendingOrder[] = ((pend ?? []) as PendingRow[])
    .filter((o) => naoExpirou(o.expires_at))
    .map((o) => ({
      id: o.id,
      total: Number(o.total),
      pixCopyPaste: o.pix_copy_paste ?? "",
      expiresAt: o.expires_at,
      title: (o.order_items ?? []).map((i) => `${i.event_title} (${i.tier_name} × ${i.quantity})`).join(", ") || "Pedido",
    }));

  return (
    <section>
      <p className="corpo-suave mb-6">Apresente o QR code na entrada do evento.</p>
      <IngressosTabs tickets={withQr} pendentes={pendentes} />
    </section>
  );
}
