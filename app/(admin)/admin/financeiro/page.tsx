import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { computePlatformFinance } from "@/lib/finance";
import { FinanceiroAdmin, type RequestRow, type LedgerRow } from "@/components/elleva/financeiro-admin";

export const metadata: Metadata = { title: "Financeiro · Admin" };

const STATUS_LABEL: Record<string, string> = {
  paid: "Pago",
  requested: "Em análise",
  rejected: "Não aprovado",
};

export default async function AdminFinanceiro() {
  const svc = await createServiceClient();
  const plat = await computePlatformFinance(svc);

  // NÃO usar embed profiles(...) aqui: payouts e finance_adjustments têm DUAS
  // FKs para profiles (producer_id e created_by) → o embed fica ambíguo e a
  // consulta falha silenciosamente. Busca os perfis em separado.
  const [{ data: pays }, { data: adjs }] = await Promise.all([
    svc
      .from("payouts")
      .select("id, producer_id, amount, fee_amount, net_amount, kind, status, reference, receipt_path, created_at, paid_at, rejected_reason")
      .order("created_at", { ascending: false }),
    svc
      .from("finance_adjustments")
      .select("id, producer_id, kind, amount, reason, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const ids = [...new Set([...(pays ?? []).map((p) => p.producer_id as string), ...(adjs ?? []).map((a) => a.producer_id as string)])];
  const { data: profs } = ids.length
    ? await svc.from("profiles").select("id, full_name, payout_holder, payout_pix_key").in("id", ids)
    : { data: [] as { id: string; full_name: string | null; payout_holder: string | null; payout_pix_key: string | null }[] };
  const profById = new Map((profs ?? []).map((p) => [p.id, p]));
  const nomeDe = new Map(plat.produtores.map((p) => [p.producerId, p.nome]));

  const nome = (pid: string) => {
    const p = profById.get(pid);
    return nomeDe.get(pid) || p?.full_name || p?.payout_holder || `Produtor ${pid.slice(0, 8)}`;
  };

  const requests: RequestRow[] = (pays ?? [])
    .filter((p) => p.status === "requested")
    .map((p) => ({
      id: p.id as string,
      producerId: p.producer_id as string,
      producer: nome(p.producer_id as string),
      pixKey: profById.get(p.producer_id as string)?.payout_pix_key ?? null,
      kind: String(p.kind ?? "normal"),
      amount: Number(p.amount),
      fee: Number(p.fee_amount ?? 0),
      net: Number(p.net_amount ?? p.amount),
      created_at: p.created_at as string,
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const ledger: LedgerRow[] = [
    ...(pays ?? []).map((p) => ({
      id: p.id as string,
      data: (p.paid_at ?? p.created_at) as string,
      produtor: nome(p.producer_id as string),
      tipo: p.kind === "advance" ? "Antecipação" : "Repasse",
      status: STATUS_LABEL[String(p.status)] ?? String(p.status),
      valor: -Number(p.amount),
      taxa: Number(p.fee_amount ?? 0),
      referencia: (p.reference as string) ?? (p.rejected_reason as string) ?? "",
      receiptPath: (p.receipt_path as string) ?? null,
      isPayout: true,
    })),
    ...(adjs ?? []).map((a) => ({
      id: a.id as string,
      data: a.created_at as string,
      produtor: nome(a.producer_id as string),
      tipo: a.kind === "credit" ? "Crédito" : "Débito",
      status: "Lançamento",
      valor: a.kind === "credit" ? Number(a.amount) : -Number(a.amount),
      taxa: 0,
      referencia: (a.reason as string) ?? "",
      receiptPath: null,
      isPayout: false,
    })),
  ].sort((x, y) => (y.data ?? "").localeCompare(x.data ?? ""));

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Financeiro</h1>
      <p className="corpo-suave mb-6 mt-1">
        Receita da Elleva, saldo dos produtores, repasses e lançamentos. O dinheiro fica retido até você concluir cada repasse.
      </p>
      <FinanceiroAdmin plat={plat} requests={requests} ledger={ledger} />
    </div>
  );
}
