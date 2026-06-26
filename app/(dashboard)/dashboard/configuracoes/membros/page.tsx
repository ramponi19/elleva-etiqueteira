import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { InviteForm } from "@/components/dashboard/invite-form";
import { revokeInvitation } from "@/lib/actions/members";
import type { Invitation, Profile } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Membros" };

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
  viewer: "Visualizador",
};

export default async function MembrosPage() {
  const supabase = await createClient();
  const { data: orgId } = await supabase.rpc("my_org_id");

  const [membersResult, invitesResult] = await Promise.all([
    orgId
      ? supabase
          .from("profiles")
          .select("id, full_name, role, avatar_url")
          .eq("org_id", orgId)
      : Promise.resolve({ data: [] }),
    orgId
      ? supabase
          .from("invitations")
          .select("*")
          .eq("org_id", orgId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const members = (membersResult.data ?? []) as Pick<
    Profile,
    "id" | "full_name" | "role" | "avatar_url"
  >[];
  const invites = (invitesResult.data ?? []) as Invitation[];

  return (
    <>
      <Header
        title="Membros da Equipe"
        description="Convide e gerencie quem tem acesso."
      />

      <main className="p-6 max-w-3xl space-y-6">
        {!orgId ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-700">
            Configure sua organização antes de convidar membros.{" "}
            <a href="/dashboard/configuracoes" className="underline font-medium">
              Configurar agora
            </a>
          </div>
        ) : (
          <>
            {/* Invite */}
            <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-6">
              <h2
                className="text-lg text-[#1A2744] mb-1"
                style={{ fontFamily: "var(--font-instrument-serif), serif" }}
              >
                Convidar membro
              </h2>
              <p className="text-[#1A2744]/50 text-sm mb-5">
                Enviaremos um convite por email.
              </p>
              <InviteForm />
            </div>

            {/* Pending invites */}
            {invites.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-6">
                <h3 className="text-sm font-semibold text-[#1A2744]/60 mb-4">
                  Convites pendentes ({invites.length})
                </h3>
                <div className="space-y-2">
                  {invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2.5 border-b border-[#1A2744]/5 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-[#1A2744]">{inv.email}</p>
                        <p className="text-xs text-[#1A2744]/40">
                          {ROLE_LABEL[inv.role]} · expira{" "}
                          {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await revokeInvitation(inv.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-red-400/70 hover:text-red-500 transition-colors"
                        >
                          Revogar
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-6">
              <h3 className="text-sm font-semibold text-[#1A2744]/60 mb-4">
                Membros ativos ({members.length})
              </h3>
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 py-2.5 border-b border-[#1A2744]/5 last:border-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1A2744] flex items-center justify-center text-white text-xs font-semibold">
                      {(m.full_name ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#1A2744]">
                        {m.full_name ?? "Sem nome"}
                      </p>
                    </div>
                    <span className="text-xs bg-[#1A2744]/6 text-[#1A2744]/60 px-2.5 py-1 rounded-full">
                      {ROLE_LABEL[m.role]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
