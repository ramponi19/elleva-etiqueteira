"use client";

import { useMemo, useState, useTransition } from "react";
import { clsx } from "clsx";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { PromptDialog } from "@/components/ui/modal";
import { IngressoCard } from "@/components/elleva/ingresso-card";
import { fmtBRL } from "@/lib/format";
import { transferTicket } from "@/lib/actions/tickets";
import { issueCertificate } from "@/lib/actions/certificates";

export interface TicketView {
  id: string;
  code: string;
  event_title: string;
  tier_name: string;
  status: string;
  qr: string;
  certEligible?: boolean; // evento emite certificado (botão aparece nos utilizados)
}

export interface PendingOrder {
  id: string;
  total: number;
  pixCopyPaste: string;
  expiresAt: string | null;
  title: string;
}

type TabKey = "valid" | "pending" | "used" | "cancelled";

export function IngressosTabs({ tickets, pendentes = [] }: { tickets: TicketView[]; pendentes?: PendingOrder[] }) {
  const [tab, setTab] = useState<TabKey>("valid");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [transferId, setTransferId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const g: Record<"valid" | "used" | "cancelled", TicketView[]> = { valid: [], used: [], cancelled: [] };
    for (const t of tickets) {
      if (t.status === "used") g.used.push(t);
      else if (t.status === "cancelled") g.cancelled.push(t);
      else g.valid.push(t);
    }
    return g;
  }, [tickets]);

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "valid", label: "Válidos", count: grouped.valid.length },
    { key: "pending", label: "Pendentes", count: pendentes.length },
    { key: "used", label: "Utilizados", count: grouped.used.length },
    { key: "cancelled", label: "Cancelados", count: grouped.cancelled.length },
  ];

  const total = tickets.length + pendentes.length;
  if (!total) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius-card)] border-[1.5px] border-dashed border-tinta bg-white py-16 text-center">
        <Icon icon="solar:ticket-bold-duotone" style={{ fontSize: 56, color: "var(--color-tinta-35)" }} />
        <p className="corpo mt-4 text-tinta-60">Você ainda não tem ingressos.</p>
        <Button href="/" variante="primario" className="mt-6">Explorar eventos</Button>
      </div>
    );
  }

  function transferir(email: string) {
    const id = transferId;
    if (!id) return;
    setMsg(null);
    startTransition(async () => {
      const r = await transferTicket(id, email);
      setTransferId(null);
      setMsg(r.ok ? `Ingresso transferido para ${email}.` : r.error ?? "Erro ao transferir.");
    });
  }

  function baixarCertificado(id: string) {
    setMsg(null);
    startTransition(async () => {
      const r = await issueCertificate(id);
      if (r.ok) window.open(`/certificado/${r.code}`, "_blank", "noopener");
      else setMsg(r.error ?? "Não foi possível gerar o certificado.");
    });
  }

  const lista = tab === "used" || tab === "cancelled" || tab === "valid" ? grouped[tab] : [];

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto overflow-y-hidden border-b-[1.5px] border-tinta">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={clsx(
              "rotulo -mb-[1.5px] flex items-center gap-2 whitespace-nowrap border-b-[3px] px-4 py-3 transition-colors",
              tab === t.key ? "border-sol text-tinta" : "border-transparent text-tinta-60 hover:text-tinta"
            )}
          >
            {t.label}
            <span className="rounded-full bg-papel-2 px-1.5 py-0.5 text-[11px] tabular-nums text-tinta-60">{t.count}</span>
          </button>
        ))}
      </div>

      {msg && (
        <p className="mb-4 rounded-[10px] border-[1.5px] border-tinta bg-papel-2 px-4 py-2.5 text-[13.5px] text-tinta">{msg}</p>
      )}

      {tab === "pending" ? (
        pendentes.length ? (
          <div className="flex flex-col gap-4">
            {pendentes.map((o) => (
              <div key={o.id} className="rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="m-0 text-[15px] font-medium text-tinta">{o.title}</p>
                  <span className="numero text-[16px] text-tinta">{fmtBRL(o.total)}</span>
                </div>
                <p className="rotulo mt-2 text-sol-escuro">Aguardando pagamento via Pix</p>
                {o.pixCopyPaste && (
                  <div className="mt-3">
                    <p className="corpo-suave mb-1">Pix copia e cola:</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={o.pixCopyPaste}
                        onFocus={(e) => e.currentTarget.select()}
                        className="min-w-0 flex-1 rounded-[8px] border-[1.5px] border-tinta bg-papel-2 px-3 py-2 font-mono text-[11.5px] text-tinta-70"
                      />
                      <Button type="button" variante="tinta" onClick={() => navigator.clipboard?.writeText(o.pixCopyPaste)}>
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="corpo-suave py-12 text-center">Nenhum pagamento pendente.</p>
        )
      ) : lista.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {lista.map((t) => (
            <div key={t.id} className="flex flex-col gap-2">
              <IngressoCard eventTitle={t.event_title} tierName={t.tier_name} status={t.status} code={t.code} qr={t.qr} />
              {tab === "valid" && (
                <button
                  type="button"
                  onClick={() => setTransferId(t.id)}
                  disabled={pending}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-tinta px-3 py-2.5 text-[13px] font-medium text-tinta transition-colors hover:bg-papel-2 disabled:opacity-50"
                >
                  <Icon icon="lucide:send" style={{ fontSize: 15 }} /> Transferir ingresso
                </button>
              )}
              {tab === "used" && t.certEligible && (
                <button
                  type="button"
                  onClick={() => baixarCertificado(t.id)}
                  disabled={pending}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-tinta px-3 py-2.5 text-[13px] font-medium text-tinta transition-colors hover:bg-papel-2 disabled:opacity-50"
                >
                  <Icon icon="lucide:award" style={{ fontSize: 15 }} /> Baixar certificado
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="corpo-suave py-12 text-center">Nenhum ingresso nesta aba.</p>
      )}

      <PromptDialog
        open={transferId !== null}
        onClose={() => setTransferId(null)}
        onSubmit={transferir}
        title="Transferir ingresso"
        message="A pessoa vê o ingresso ao entrar na conta Elleva com esse e-mail. O código é renovado — o seu deixa de valer."
        label="E-mail de quem vai receber"
        placeholder="pessoa@email.com"
        inputMode="email"
        confirmLabel="Transferir"
        pending={pending}
        validate={(v) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : "Digite um e-mail válido.")}
      />
    </div>
  );
}
