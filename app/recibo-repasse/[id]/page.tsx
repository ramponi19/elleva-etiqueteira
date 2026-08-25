import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { fmtBRL } from "@/lib/format";

export const metadata: Metadata = { title: "Recibo de repasse", robots: { index: false, follow: false } };

const fmtDT = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));

export default async function ReciboRepasse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, role } = await getAuth();
  if (!user) notFound();

  const svc = await createServiceClient();
  const { data: p } = await svc
    .from("payouts")
    .select("id, producer_id, amount, net_amount, fee_amount, fee_pct, kind, status, method, reference, paid_at, created_at")
    .eq("id", id)
    .single();
  // Autorização: admin ou o produtor dono do repasse. Recibo só de repasse PAGO.
  if (!p || (role !== "admin" && p.producer_id !== user.id)) notFound();
  if (p.status !== "paid") notFound();

  const { data: prof } = await svc.from("profiles").select("full_name, payout_holder, payout_doc").eq("id", p.producer_id).single();
  const nome = (prof?.full_name as string) || (prof?.payout_holder as string) || "Produtor";
  const bruto = Number(p.amount);
  const fee = Number(p.fee_amount ?? 0);
  const net = Number(p.net_amount ?? p.amount);
  const isAdvance = p.kind === "advance";

  const linha = (rotulo: string, valor: string, forte = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px dashed #ccc" }}>
      <span style={{ color: forte ? "#141210" : "#555", fontWeight: forte ? 700 : 400 }}>{rotulo}</span>
      <span style={{ fontWeight: forte ? 800 : 500, fontSize: forte ? 20 : 15 }}>{valor}</span>
    </div>
  );

  return (
    <main style={{ background: "#fff", minHeight: "100vh", padding: "40px 20px", fontFamily: "Arial, Helvetica, sans-serif", color: "#141210" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", border: "2px solid #141210", borderRadius: 14, padding: "28px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 20 }}>Elleva <span style={{ color: "#E8481F" }}>Tickets</span></span>
          <span style={{ color: "#C93A15", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>Recibo de repasse</span>
        </div>
        <p style={{ color: "#555", fontSize: 12, margin: "4px 0 0" }}>
          Comprovante interno de repasse ao produtor. Não é documento fiscal (NFS-e).
        </p>

        <h1 style={{ fontSize: 30, fontWeight: 900, margin: "22px 0 0" }}>{fmtBRL(net)}</h1>
        <p style={{ color: "#555", fontSize: 14, margin: "2px 0 0" }}>
          {isAdvance ? "Antecipação" : "Repasse"} para <strong>{nome}</strong>
          {prof?.payout_doc ? ` · doc ${prof.payout_doc}` : ""}
        </p>

        <div style={{ marginTop: 22 }}>
          {linha("Valor do saldo", fmtBRL(bruto))}
          {isAdvance && linha(`Taxa de antecipação${p.fee_pct ? ` (${p.fee_pct}%)` : ""}`, `− ${fmtBRL(fee)}`)}
          {linha("Valor recebido", fmtBRL(net), true)}
          {linha("Data do repasse", fmtDT((p.paid_at as string) ?? (p.created_at as string)))}
          {linha("Método", (p.method as string) || "Pix")}
          {p.reference ? linha("Referência", p.reference as string) : null}
          {linha("Nº do repasse", String(p.id).slice(0, 13))}
        </div>

        <p style={{ color: "#888", fontSize: 11, marginTop: 22, lineHeight: 1.5 }}>
          Elleva Tickets · bilheteria oficial do interior. Este recibo comprova o valor repassado
          ao produtor pela plataforma. Para efeitos fiscais, emita a nota correspondente.
        </p>
      </div>
    </main>
  );
}
