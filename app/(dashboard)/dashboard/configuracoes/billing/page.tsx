import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { BillingPlans } from "@/components/dashboard/billing-plans";
import { ManageBillingButton } from "@/components/dashboard/manage-billing-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Plano e Cobrança" };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active: { label: "Ativo", cls: "bg-green-50 text-green-600" },
  trialing: { label: "Período de teste", cls: "bg-blue-50 text-blue-600" },
  past_due: { label: "Pagamento pendente", cls: "bg-red-50 text-red-600" },
  canceled: { label: "Cancelado", cls: "bg-gray-100 text-gray-500" },
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: orgId } = await supabase.rpc("my_org_id");

  const orgResult = orgId
    ? await supabase
        .from("organizations")
        .select("id, plan, subscription_status, stripe_subscription_id, trial_ends_at")
        .eq("id", orgId)
        .single()
    : { data: null };

  const org = orgResult.data as {
    id: string;
    plan: string;
    subscription_status: string | null;
    stripe_subscription_id: string | null;
    trial_ends_at: string | null;
  } | null;

  const status = org?.subscription_status ?? "trialing";
  const statusInfo = STATUS_LABEL[status] ?? STATUS_LABEL.trialing;
  const hasActiveSub = !!org?.stripe_subscription_id;

  return (
    <>
      <Header title="Plano e Cobrança" description="Gerencie sua assinatura." />

      <main className="p-6 max-w-4xl space-y-6">
        {!orgId ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-700">
            Configure sua organização antes de assinar um plano.{" "}
            <a href="/dashboard/configuracoes" className="underline font-medium">
              Configurar agora
            </a>
          </div>
        ) : (
          <>
            {/* Current plan card */}
            <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-6 flex items-center justify-between">
              <div>
                <p className="text-[#1A2744]/40 text-xs mb-1">Plano atual</p>
                <div className="flex items-center gap-3">
                  <h2
                    className="text-2xl text-[#1A2744] capitalize"
                    style={{
                      fontFamily: "var(--font-instrument-serif), serif",
                    }}
                  >
                    {org?.plan ?? "Starter"}
                  </h2>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.cls}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                {org?.trial_ends_at && status === "trialing" && (
                  <p className="text-[#1A2744]/40 text-xs mt-2">
                    Teste termina em{" "}
                    {new Date(org.trial_ends_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
              {hasActiveSub && <ManageBillingButton />}
            </div>

            {/* Plans */}
            <BillingPlans currentPlan={org?.plan ?? "starter"} />
          </>
        )}
      </main>
    </>
  );
}
