import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL } from "@/lib/format";
import CouponForm from "@/components/app/coupon-form";
import { CouponToggle } from "@/components/app/coupon-toggle";

export const metadata: Metadata = { title: "Cupons · Admin" };

export default async function AdminCupons() {
  // Layout NÃO protege página: no App Router as duas renderizam em paralelo,
  // então o redirect do layout não impede esta consulta de rodar (docs do Next:
  // "A layout also does not control whether the rest of the route renders").
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("code, discount_type, discount_value, max_uses, used_count, active, expires_at, created_at")
    .order("created_at", { ascending: false });

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Cupons de desconto</h1>
      <p className="corpo-suave mb-6 mt-1">Crie e acompanhe cupons.</p>

      <div className={`${card} mb-5 p-5`}>
        <CouponForm />
      </div>

      <div className={card}>
        {(coupons ?? []).map((c, i) => (
          <div
            key={c.code}
            className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}
          >
            <div>
              <p className="m-0 font-mono text-[14px] font-semibold tracking-wide text-tinta">{c.code}</p>
              <p className="corpo-suave m-0">
                {c.discount_type === "percent" ? `${c.discount_value}% off` : `${fmtBRL(Number(c.discount_value))} off`}
                {" · "}
                {c.used_count}{c.max_uses != null ? `/${c.max_uses}` : ""} usos
              </p>
            </div>
            <CouponToggle code={c.code as string} active={!!c.active} />
          </div>
        ))}
        {!coupons?.length && <p className="corpo-suave px-5 py-12 text-center">Nenhum cupom criado ainda.</p>}
      </div>
    </div>
  );
}
