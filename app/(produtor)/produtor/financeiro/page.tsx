import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { computeProducerFinance } from "@/lib/finance";
import { FinanceiroProdutor, type PayoutView } from "@/components/elleva/financeiro-produtor";
import { EmBreve } from "@/components/elleva/em-breve";

export const metadata: Metadata = { title: "Financeiro · Produtor" };

export default async function ProdutorFinanceiro() {
  const { user } = await getAuth();
  if (!user) return null;

  const svc = await createServiceClient();
  const fin = await computeProducerFinance(svc, user.id);

  const { data: payoutsData } = await svc
    .from("payouts")
    .select("amount, status, method, reference, note, created_at, paid_at, rejected_reason")
    .eq("producer_id", user.id)
    .order("created_at", { ascending: false });
  const payouts = (payoutsData ?? []) as PayoutView[];

  const { data: prof } = await svc
    .from("profiles")
    .select("payout_pix_key, payout_pix_type, payout_holder, payout_doc")
    .eq("id", user.id)
    .single();

  const conta = {
    pixType: prof?.payout_pix_type ?? "cpf",
    pixKey: prof?.payout_pix_key ?? "",
    holder: prof?.payout_holder ?? "",
    doc: prof?.payout_doc ?? "",
  };

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Financeiro</h1>
      <p className="corpo-suave mb-6 mt-1">Seu saldo, extrato por evento, repasses e conta de recebimento.</p>

      {fin.eventos.length === 0 && payouts.length === 0 && !conta.pixKey ? (
        <EmBreve icon="lucide:wallet" nota="Crie um evento e comece a vender — seu saldo e repasses aparecem aqui." />
      ) : (
        <FinanceiroProdutor fin={fin} payouts={payouts} conta={conta} temPix={!!conta.pixKey} />
      )}
    </div>
  );
}
