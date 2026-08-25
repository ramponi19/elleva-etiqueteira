"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, PromptDialog } from "@/components/ui/modal";
import FeaturedToggle from "@/components/app/featured-toggle";
import { deleteEvent, cancelEvent } from "@/lib/actions/events";
import { setEventFeePct, setEventMaxInstallments } from "@/lib/actions/admin";

export interface AdminEvent {
  id: string;
  title: string;
  category: string;
  city: string;
  starts_at: string;
  starts_label: string; // formatado no servidor (evita mismatch de hidratação)
  status: string;
  is_featured: boolean;
  service_fee_pct: number;
  max_installments: number;
}

type TabKey = "ativos" | "pendentes" | "encerrados" | "cancelados";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ativos", label: "Ativos" },
  { key: "pendentes", label: "Pendentes" },
  { key: "encerrados", label: "Encerrados" },
  { key: "cancelados", label: "Cancelados" },
];

const STATUS_TOM: Record<string, "sol" | "papel" | "tinta" | "cartaz"> = {
  published: "sol",
  sold_out: "cartaz",
  draft: "papel",
  cancelled: "tinta",
};

function classify(e: AdminEvent, now: number): TabKey {
  if (e.status === "cancelled") return "cancelados";
  if (e.status === "draft") return "pendentes";
  if (new Date(e.starts_at).getTime() < now) return "encerrados";
  return "ativos";
}

export function AdminEventsList({ events }: { events: AdminEvent[] }) {
  const [items, setItems] = useState(events);
  const [tab, setTab] = useState<TabKey>("ativos");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminEvent | null>(null);
  const [feeTarget, setFeeTarget] = useState<AdminEvent | null>(null);
  const [parcelasTarget, setParcelasTarget] = useState<AdminEvent | null>(null);

  const grouped = useMemo(() => {
    const g: Record<TabKey, AdminEvent[]> = { ativos: [], pendentes: [], encerrados: [], cancelados: [] };
    for (const e of items) g[classify(e, now)].push(e);
    return g;
  }, [items, now]);

  const lista = grouped[tab];

  function doRemove() {
    const t = deleteTarget;
    if (!t) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteEvent(t.id);
      setDeleteTarget(null);
      if (res.ok) setItems((s) => s.filter((e) => e.id !== t.id));
      else setError(res.error ?? "Erro ao excluir.");
    });
  }

  function doCancel() {
    const t = cancelTarget;
    if (!t) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelEvent(t.id);
      setCancelTarget(null);
      if (res.ok) {
        setItems((s) => s.map((ev) => (ev.id === t.id ? { ...ev, status: "cancelled" } : ev)));
        const r = res.resumo;
        if (r) setError(`“${t.title}” cancelado: ${r.reembolsados} reembolsado(s), ${r.pendentesCancelados} pendente(s) cancelado(s)${r.falhas ? `, ${r.falhas} estorno(s) a retentar` : ""}.`);
      } else setError(res.error ?? "Erro ao cancelar.");
    });
  }

  // taxa de serviço negociada por evento (padrão 10%) — só admin
  function doFee(raw: string) {
    const t = feeTarget;
    if (!t) return;
    const pct = Number(raw.replace(",", "."));
    setError(null);
    startTransition(async () => {
      const res = await setEventFeePct(t.id, pct);
      setFeeTarget(null);
      if (res.ok) setItems((s) => s.map((ev) => (ev.id === t.id ? { ...ev, service_fee_pct: pct } : ev)));
      else setError(res.error ?? "Erro ao salvar a taxa.");
    });
  }

  // nº máximo de parcelas no cartão (padrão 12) — só admin
  function doParcelas(raw: string) {
    const t = parcelasTarget;
    if (!t) return;
    const n = parseInt(raw, 10);
    setError(null);
    startTransition(async () => {
      const res = await setEventMaxInstallments(t.id, n);
      setParcelasTarget(null);
      if (res.ok) setItems((s) => s.map((ev) => (ev.id === t.id ? { ...ev, max_installments: n } : ev)));
      else setError(res.error ?? "Erro ao salvar as parcelas.");
    });
  }

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b-[1.5px] border-tinta">
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
            <span className="rounded-full bg-papel-2 px-1.5 py-0.5 text-[11px] tabular-nums text-tinta-60">
              {grouped[t.key].length}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-4 py-2.5 text-[13.5px] text-sol-escuro">
          {error}
        </p>
      )}

      <div className={card}>
        {lista.map((e, i) => (
          <div
            key={e.id}
            className={clsx(
              "flex flex-wrap items-center justify-between gap-3 px-5 py-3.5",
              i && "border-t-[1.5px] border-dashed border-tinta"
            )}
          >
            <div className="min-w-0">
              <p className="m-0 truncate text-[14px] font-medium text-tinta">{e.title}</p>
              <p className="corpo-suave m-0">{e.city} · {e.starts_label}</p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              <Badge tom="papel">{e.category}</Badge>
              <Badge tom={STATUS_TOM[e.status] ?? "papel"}>{e.status}</Badge>
              <button
                type="button"
                onClick={() => setFeeTarget(e)}
                disabled={pending}
                title="Taxa de serviço paga pelo comprador — clique pra negociar"
                className="inline-flex min-h-[38px] items-center rounded-full border-[1.5px] border-tinta px-3 py-2 text-[12px] font-medium tabular-nums text-tinta transition-colors hover:bg-papel-2 disabled:opacity-50"
              >
                taxa {e.service_fee_pct}%
              </button>
              <button
                type="button"
                onClick={() => setParcelasTarget(e)}
                disabled={pending}
                title="Máximo de parcelas no cartão — clique pra ajustar"
                className="inline-flex min-h-[38px] items-center rounded-full border-[1.5px] border-tinta px-3 py-2 text-[12px] font-medium tabular-nums text-tinta transition-colors hover:bg-papel-2 disabled:opacity-50"
              >
                até {e.max_installments}x
              </button>
              <FeaturedToggle id={e.id} initial={e.is_featured} />
              <Link
                href={`/produtor/eventos/${e.id}`}
                className="inline-flex min-h-[38px] items-center rounded-full border-[1.5px] border-tinta px-3 py-2 text-[12px] font-medium text-tinta transition-colors hover:bg-papel-2"
              >
                Editar
              </Link>
              {e.status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => setCancelTarget(e)}
                  disabled={pending}
                  aria-label={`Cancelar ${e.title}`}
                  title="Cancela o evento e reembolsa todos os compradores"
                  className="inline-flex min-h-[38px] items-center rounded-full border-[1.5px] border-tinta px-3 py-2 text-[12px] font-medium text-sol-escuro transition-colors hover:bg-papel-2 disabled:opacity-50"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteTarget(e)}
                disabled={pending}
                aria-label={`Excluir ${e.title}`}
                className="inline-flex min-h-[38px] items-center rounded-full border-[1.5px] border-tinta px-3 py-2 text-[12px] font-medium text-sol-escuro transition-colors hover:bg-papel-2 disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        {!lista.length && (
          <p className="corpo-suave px-5 py-12 text-center">Nenhum evento nesta aba.</p>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doRemove}
        title="Excluir evento"
        message={deleteTarget ? <>Excluir <strong>“{deleteTarget.title}”</strong>? Esta ação é permanente e não pode ser desfeita.</> : null}
        confirmLabel="Excluir"
        danger
        pending={pending}
      />
      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={doCancel}
        title="Cancelar evento"
        message={cancelTarget ? <>Cancelar <strong>“{cancelTarget.title}”</strong> e <strong>reembolsar todos os compradores</strong>? As vendas param na hora e os ingressos são invalidados. Não pode ser desfeito.</> : null}
        confirmLabel="Cancelar e reembolsar"
        danger
        pending={pending}
      />
      <PromptDialog
        open={feeTarget !== null}
        onClose={() => setFeeTarget(null)}
        onSubmit={doFee}
        title="Taxa de serviço"
        message={feeTarget ? <>Percentual pago pelo comprador em <strong>{feeTarget.title}</strong> (0 a 100).</> : null}
        label="Taxa (%)"
        defaultValue={feeTarget ? String(feeTarget.service_fee_pct) : ""}
        inputMode="numeric"
        pending={pending}
        validate={(v) => {
          const pct = Number(v.replace(",", "."));
          return Number.isFinite(pct) && pct >= 0 && pct <= 100 ? null : "Percentual inválido (0 a 100).";
        }}
      />
      <PromptDialog
        open={parcelasTarget !== null}
        onClose={() => setParcelasTarget(null)}
        onSubmit={doParcelas}
        title="Máximo de parcelas"
        message={parcelasTarget ? <>Parcelas no cartão para <strong>{parcelasTarget.title}</strong> (1 a 12).</> : null}
        label="Parcelas"
        defaultValue={parcelasTarget ? String(parcelasTarget.max_installments) : ""}
        inputMode="numeric"
        pending={pending}
        validate={(v) => {
          const n = parseInt(v, 10);
          return Number.isInteger(n) && n >= 1 && n <= 12 ? null : "Parcelas inválidas (1 a 12).";
        }}
      />
    </div>
  );
}
