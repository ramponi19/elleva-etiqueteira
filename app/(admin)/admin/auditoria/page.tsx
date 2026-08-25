import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Auditoria · Admin" };

const ACOES: Record<string, string> = {
  set_role: "Mudou papel de usuário",
  order_refunded: "Reembolsou pedido",
  order_cancelled: "Cancelou pedido",
  payout_paid: "Marcou repasse como pago",
  payout_rejected: "Negou solicitação de repasse",
  payout_direct: "Repassou saldo direto",
  adjustment_create: "Lançamento manual",
  adjustment_reversed: "Estornou lançamento",
  advance_settings: "Ajustou antecipação",
  cancel_event: "Cancelou evento",
};

const fmtDT = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));

export default async function AdminAuditoria() {
  const svc = await createServiceClient();
  const { data: linhas } = await svc
    .from("audit_log")
    .select("id, actor_email, action, target, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Auditoria</h1>
      <p className="corpo-suave mb-6 mt-1">
        Rastro das ações administrativas sensíveis — quem fez, o quê e quando. Somente leitura.
      </p>
      <div className={card}>
        {(linhas ?? []).map((l, i) => (
          <div key={l.id} className={`px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="m-0 text-[14px] font-medium text-tinta">{ACOES[l.action] ?? l.action}</p>
              <span className="corpo-suave text-[12.5px]">{fmtDT(l.created_at)}</span>
            </div>
            <p className="corpo-suave m-0 mt-0.5 text-[12.5px]">
              por {l.actor_email ?? "sistema"}{l.target ? ` · alvo ${String(l.target).slice(0, 18)}` : ""}
            </p>
            {l.detail && Object.keys(l.detail).length > 0 && (
              <p className="corpo-suave m-0 mt-1 font-mono text-[11.5px] text-tinta-60">
                {Object.entries(l.detail as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join(" · ")}
              </p>
            )}
          </div>
        ))}
        {!linhas?.length && <p className="corpo-suave px-5 py-12 text-center">Nenhuma ação registrada ainda.</p>}
      </div>
    </div>
  );
}
