"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/badge";
import FeaturedToggle from "@/components/app/featured-toggle";
import { deleteEvent } from "@/lib/actions/events";

export interface AdminEvent {
  id: string;
  title: string;
  category: string;
  city: string;
  starts_at: string;
  status: string;
  is_featured: boolean;
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

  const grouped = useMemo(() => {
    const g: Record<TabKey, AdminEvent[]> = { ativos: [], pendentes: [], encerrados: [], cancelados: [] };
    for (const e of items) g[classify(e, now)].push(e);
    return g;
  }, [items, now]);

  const lista = grouped[tab];

  function remove(id: string, title: string) {
    if (!confirm(`Excluir "${title}"? Esta ação é permanente.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteEvent(id);
      if (res.ok) setItems((s) => s.filter((e) => e.id !== id));
      else setError(res.error ?? "Erro ao excluir.");
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
              <p className="corpo-suave m-0">{e.city} · {new Date(e.starts_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              <Badge tom="papel">{e.category}</Badge>
              <Badge tom={STATUS_TOM[e.status] ?? "papel"}>{e.status}</Badge>
              <FeaturedToggle id={e.id} initial={e.is_featured} />
              <Link
                href={`/produtor/eventos/${e.id}`}
                className="rounded-full border-[1.5px] border-tinta px-3 py-1.5 text-[12px] font-medium text-tinta transition-colors hover:bg-papel-2"
              >
                Editar
              </Link>
              <button
                type="button"
                onClick={() => remove(e.id, e.title)}
                disabled={pending}
                aria-label={`Excluir ${e.title}`}
                className="rounded-full border-[1.5px] border-tinta px-3 py-1.5 text-[12px] font-medium text-sol-escuro transition-colors hover:bg-papel-2 disabled:opacity-50"
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
    </div>
  );
}
