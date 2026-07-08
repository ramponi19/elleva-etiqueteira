import type { Metadata } from "next";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { IngressosTabs, type TicketView } from "@/components/elleva/ingressos-tabs";

export const metadata: Metadata = { title: "Meus ingressos" };

export default async function ContaOverview() {
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, code, event_title, tier_name, status, created_at")
    .order("created_at", { ascending: false });

  const withQr: TicketView[] = await Promise.all(
    (tickets ?? []).map(async (t) => ({
      id: t.id,
      code: t.code,
      event_title: t.event_title,
      tier_name: t.tier_name,
      status: t.status,
      qr: await QRCode.toDataURL(t.code, {
        margin: 1,
        width: 220,
        color: { dark: "#141210", light: "#ffffff" },
      }),
    }))
  );

  return (
    <section>
      <p className="corpo-suave mb-6">Apresente o QR code na entrada do evento.</p>
      <IngressosTabs tickets={withQr} />
    </section>
  );
}
