import type { Metadata } from "next";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { IngressosTabs, type TicketView, type PendingOrder } from "@/components/elleva/ingressos-tabs";

export const metadata: Metadata = { title: "Meus ingressos" };

const naoExpirou = (iso: string | null) => !iso || new Date(iso).getTime() > Date.now();

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
      .select("id, code, event_title, tier_name, seat_label, status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, total, pix_copy_paste, expires_at, created_at, order_items(event_title, tier_name, quantity)")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const withQr: TicketView[] = await Promise.all(
    (tickets ?? []).map(async (t) => ({
      id: t.id,
      code: t.code,
      event_title: t.event_title,
      tier_name: t.seat_label ? `${t.tier_name} · ${t.seat_label}` : t.tier_name,
      status: t.status,
      qr: await QRCode.toDataURL(t.code, {
        margin: 1,
        width: 220,
        color: { dark: "#141210", light: "#ffffff" },
      }),
    }))
  );

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
