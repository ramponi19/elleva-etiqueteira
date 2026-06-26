import type { Metadata } from "next";
import AgendaRow from "@/components/marketing/agenda-row";
import { EVENTS } from "@/lib/events";

export const metadata: Metadata = { title: "Agenda" };

const FILTERS = ["Todos", "Shows", "Festas", "Esportes", "Teatro", "Corporativo"];

export default function AgendaPage() {
  return (
    <div className="container" style={{ padding: "48px 48px 64px" }}>
      <span className="eyebrow eyebrow-gold">Agenda completa</span>
      <h1 className="h1" style={{ fontSize: 48, marginTop: 18 }}>
        Todos os <span className="serif accent-gold">eventos</span>
      </h1>

      <div className="chips" style={{ marginTop: 28 }}>
        {FILTERS.map((f, i) => (
          <span key={f} className={`chip${i === 0 ? " chip--active" : ""}`}>{f}</span>
        ))}
      </div>

      <div className="agenda-list" style={{ marginTop: 32 }}>
        {EVENTS.map((ev) => (
          <AgendaRow key={ev.id} event={ev} />
        ))}
      </div>
    </div>
  );
}
