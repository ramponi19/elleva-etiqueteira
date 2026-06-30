"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/shared/icon";
import AgendaRow from "@/components/marketing/agenda-row";
import type { EventItem } from "@/lib/events";

const FILTERS: { label: string; cat: string | null }[] = [
  { label: "Todos", cat: null },
  { label: "Shows", cat: "SHOW" },
  { label: "Festas", cat: "FESTA" },
  { label: "Esportes", cat: "ESPORTE" },
  { label: "Teatro", cat: "TEATRO" },
  { label: "Corporativo", cat: "CORPORATIVO" },
];

export default function AgendaContent({
  events,
  initialQuery = "",
}: {
  events: EventItem[];
  initialQuery?: string;
}) {
  const [cat, setCat] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (cat && e.catLabel !== cat) return false;
      if (q && !`${e.title} ${e.venueCity}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, cat, query]);

  return (
    <>
      {/* search */}
      <div style={{ position: "relative", maxWidth: 420, marginTop: 28 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", display: "flex" }}>
          <Icon icon="lucide:search" style={{ fontSize: 18 }} />
        </span>
        <input
          className="input"
          style={{ paddingLeft: 44, borderRadius: 9999 }}
          placeholder="Buscar por evento ou local..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* filter chips */}
      <div className="chips" style={{ marginTop: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className={`chip${cat === f.cat ? " chip--active" : ""}`}
            onClick={() => setCat(f.cat)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* list */}
      <div className="agenda-list" style={{ marginTop: 32 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-tertiary)" }}>
            <Icon icon="solar:ticket-bold-duotone" style={{ fontSize: 48, color: "var(--text-muted)" }} />
            <p className="body" style={{ marginTop: 12 }}>Nenhum evento encontrado.</p>
          </div>
        ) : (
          filtered.map((ev) => <AgendaRow key={ev.id} event={ev} />)
        )}
      </div>
    </>
  );
}
