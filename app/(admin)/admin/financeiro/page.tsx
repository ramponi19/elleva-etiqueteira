import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { computePlatformFinance } from "@/lib/finance";
import { FinanceiroAdmin, type RequestRow } from "@/components/elleva/financeiro-admin";

export const metadata: Metadata = { title: "Financeiro · Admin" };

export default async function AdminFinanceiro() {
  const svc = await createServiceClient();
  const plat = await computePlatformFinance(svc);

  // solicitações pendentes + nome/pix do produtor
  const { data: reqs } = await svc
    .from("payouts")
    .select("id, producer_id, amount, created_at, profiles(full_name, payout_pix_key, payout_holder)")
    .eq("status", "requested")
    .order("created_at", { ascending: true });

  const requests: RequestRow[] = (reqs ?? []).map((r) => {
    const prof = (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) as { full_name: string | null; payout_pix_key: string | null; payout_holder: string | null } | null;
    return {
      id: r.id as string,
      producer: prof?.full_name || prof?.payout_holder || `Produtor ${String(r.producer_id).slice(0, 8)}`,
      pixKey: prof?.payout_pix_key ?? null,
      amount: Number(r.amount),
      created_at: r.created_at as string,
    };
  });

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Financeiro</h1>
      <p className="corpo-suave mb-6 mt-1">
        Receita da Elleva, saldo dos produtores e repasses. O dinheiro fica retido até você processar cada repasse.
      </p>
      <FinanceiroAdmin plat={plat} requests={requests} />
    </div>
  );
}
