import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { OrgSetupForm } from "@/components/dashboard/org-setup-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id, org_id, role")
    .eq("id", user!.id)
    .single();

  const profile = profileRaw as { id: string; org_id: string | null; role: string } | null;

  const orgResult = profile?.org_id
    ? await supabase
        .from("organizations")
        .select("id, name, slug, plan")
        .eq("id", profile.org_id)
        .single()
    : { data: null };
  const org = orgResult.data as { id: string; name: string; slug: string; plan: string } | null;

  return (
    <>
      <Header title="Configurações" description="Gerencie sua organização e conta." />

      <main className="p-6 max-w-2xl space-y-6">
        {/* Sub-nav */}
        <div className="flex gap-2">
          <a
            href="/dashboard/configuracoes/membros"
            className="flex-1 bg-white rounded-xl border border-[#1A2744]/8 hover:border-[#C9A96E]/40 p-4 transition-colors group"
          >
            <p className="text-sm font-medium text-[#1A2744]">Membros</p>
            <p className="text-xs text-[#1A2744]/40 mt-0.5">
              Convide e gerencie a equipe →
            </p>
          </a>
          <a
            href="/dashboard/configuracoes/billing"
            className="flex-1 bg-white rounded-xl border border-[#1A2744]/8 hover:border-[#C9A96E]/40 p-4 transition-colors group"
          >
            <p className="text-sm font-medium text-[#1A2744]">Plano e Cobrança</p>
            <p className="text-xs text-[#1A2744]/40 mt-0.5">
              Assinatura e faturas →
            </p>
          </a>
        </div>

        {/* Organização */}
        <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-8">
          <h2
            className="text-xl text-[#1A2744] mb-1"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Organização
          </h2>
          <p className="text-[#1A2744]/50 text-sm mb-6">
            Dados da sua empresa na plataforma.
          </p>
          <OrgSetupForm userId={user!.id} existingOrg={org ?? null} />
        </div>

        {/* Conta */}
        <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-8">
          <h2
            className="text-xl text-[#1A2744] mb-1"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Conta
          </h2>
          <div className="space-y-3 text-sm text-[#1A2744]/60">
            <div className="flex items-center justify-between">
              <span>Email</span>
              <span className="text-[#1A2744]">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Plano</span>
              <span className="bg-[#C9A96E]/15 text-[#C9A96E] text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {org?.plan ?? "Sem plano"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
