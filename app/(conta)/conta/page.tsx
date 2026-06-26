import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import Icon from "@/components/shared/icon";
import PageHeader from "@/components/app/page-header";

export const metadata: Metadata = { title: "Meus ingressos" };

const STATUS_LABEL: Record<string, string> = {
  valid: "Válido",
  used: "Utilizado",
  cancelled: "Cancelado",
};

export default async function ContaOverview() {
  const { user } = await getAuth();
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, code, event_title, tier_name, status, created_at")
    .order("created_at", { ascending: false });

  const withQr = await Promise.all(
    (tickets ?? []).map(async (t) => ({
      ...t,
      qr: await QRCode.toDataURL(t.code, { margin: 1, width: 220, color: { dark: "#162332", light: "#ffffff" } }),
    }))
  );

  return (
    <>
      <PageHeader title="Meus ingressos" subtitle="Apresente o QR code na entrada do evento." />
      <main style={{ padding: 32, maxWidth: 900 }}>
        {!withQr.length ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <Icon icon="solar:ticket-bold-duotone" style={{ fontSize: 56, color: "var(--text-muted)" }} />
            <p className="lede" style={{ marginTop: 16 }}>Você ainda não tem ingressos.</p>
            <Link href="/agenda" className="btn btn-navy btn-lg" style={{ marginTop: 20 }}>
              Explorar eventos
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {withQr.map((t) => (
              <div key={t.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 20, textAlign: "center", boxShadow: "var(--sh-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="cat-pill">{t.tier_name}</span>
                  <span className="cat-pill" style={{ color: t.status === "valid" ? "var(--text-gold)" : "var(--text-muted)" }}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.qr} alt={`Ingresso ${t.code}`} width={180} height={180} style={{ margin: "0 auto", display: "block", borderRadius: 8 }} />
                <p style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, margin: "12px 0 2px", color: "var(--text-primary)" }}>
                  {t.event_title}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: ".1em", color: "var(--text-tertiary)" }}>
                  {t.code}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
