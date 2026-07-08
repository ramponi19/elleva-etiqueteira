"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { IngressoCard } from "@/components/elleva/ingresso-card";

export interface TicketView {
  id: string;
  code: string;
  event_title: string;
  tier_name: string;
  status: string;
  qr: string;
}

type TabKey = "valid" | "used" | "cancelled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "valid", label: "Válidos" },
  { key: "used", label: "Utilizados" },
  { key: "cancelled", label: "Cancelados" },
];

export function IngressosTabs({ tickets }: { tickets: TicketView[] }) {
  const [tab, setTab] = useState<TabKey>("valid");

  const grouped = useMemo(() => {
    const g: Record<TabKey, TicketView[]> = { valid: [], used: [], cancelled: [] };
    for (const t of tickets) {
      if (t.status === "used") g.used.push(t);
      else if (t.status === "cancelled") g.cancelled.push(t);
      else g.valid.push(t);
    }
    return g;
  }, [tickets]);

  if (!tickets.length) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius-card)] border-[1.5px] border-dashed border-tinta bg-white py-16 text-center">
        <Icon icon="solar:ticket-bold-duotone" style={{ fontSize: 56, color: "var(--color-tinta-35)" }} />
        <p className="corpo mt-4 text-tinta-60">Você ainda não tem ingressos.</p>
        <Button href="/agenda" variante="primario" className="mt-6">
          Explorar eventos
        </Button>
      </div>
    );
  }

  const lista = grouped[tab];

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
            <span className="rounded-full bg-papel-2 px-1.5 py-0.5 text-[11px] tabular-nums text-tinta-60">
              {grouped[t.key].length}
            </span>
          </button>
        ))}
      </div>

      {lista.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {lista.map((t) => (
            <IngressoCard
              key={t.id}
              eventTitle={t.event_title}
              tierName={t.tier_name}
              status={t.status}
              code={t.code}
              qr={t.qr}
            />
          ))}
        </div>
      ) : (
        <p className="corpo-suave py-12 text-center">Nenhum ingresso nesta aba.</p>
      )}
    </div>
  );
}
