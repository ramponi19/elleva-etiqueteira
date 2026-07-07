import type { Metadata } from "next";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { IngressoCard } from "@/components/elleva/ingresso-card";

export const metadata: Metadata = { title: "Meus ingressos" };

export default async function ContaOverview() {
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, code, event_title, tier_name, status, created_at")
    .order("created_at", { ascending: false });

  const withQr = await Promise.all(
    (tickets ?? []).map(async (t) => ({
      ...t,
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

      {!withQr.length ? (
        <div className="flex flex-col items-center rounded-[var(--radius-card)] border-[1.5px] border-dashed border-tinta bg-white py-16 text-center">
          <Icon
            icon="solar:ticket-bold-duotone"
            style={{ fontSize: 56, color: "var(--color-tinta-35)" }}
          />
          <p className="corpo mt-4 text-tinta-60">Você ainda não tem ingressos.</p>
          <Button href="/agenda" variante="primario" className="mt-6">
            Explorar eventos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {withQr.map((t) => (
            <IngressoCard
              key={t.id}
              eventTitle={t.event_title}
              tierName={t.tier_name}
              status={t.status}
              code={t.code}
              qr={t.qr}
            />
          ))}
        </div>
      )}
    </section>
  );
}
