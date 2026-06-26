import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL } from "@/lib/format";
import PageHeader from "@/components/app/page-header";
import CouponForm from "@/components/app/coupon-form";

export const metadata: Metadata = { title: "Cupons · Admin" };

export default async function AdminCupons() {
  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("code, discount_type, discount_value, max_uses, used_count, active, expires_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Cupons de desconto" subtitle="Crie e acompanhe cupons." />
      <main style={{ padding: 32, maxWidth: 900 }}>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 20, marginBottom: 20 }}>
          <CouponForm />
        </div>

        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden" }}>
          {(coupons ?? []).map((c, i) => (
            <div key={c.code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, margin: 0, letterSpacing: ".05em" }}>{c.code}</p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
                  {c.discount_type === "percent" ? `${c.discount_value}% off` : `${fmtBRL(Number(c.discount_value))} off`}
                  {" · "}
                  {c.used_count}{c.max_uses != null ? `/${c.max_uses}` : ""} usos
                </p>
              </div>
              <span className="cat-pill" style={{ color: c.active ? "var(--text-gold)" : "var(--text-muted)" }}>
                {c.active ? "Ativo" : "Inativo"}
              </span>
            </div>
          ))}
          {!coupons?.length && (
            <p style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              Nenhum cupom criado ainda.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
