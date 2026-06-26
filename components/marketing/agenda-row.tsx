import Link from "next/link";
import Icon from "@/components/shared/icon";
import { fmtBRL } from "@/lib/format";
import type { EventItem } from "@/lib/events";

export default function AgendaRow({ event }: { event: EventItem }) {
  return (
    <Link href={`/evento/${event.id}`} className="agenda-row">
      <div className="date-block">
        <span className="d">{event.d}</span>
        <span className="m">{event.mon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 500, letterSpacing: "-.02em" }}>
          {event.title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 5, display: "flex", gap: 18, flexWrap: "wrap" }}>
          <span><Icon icon="lucide:map-pin" style={{ verticalAlign: -2 }} /> {event.venueCity}</span>
          <span><Icon icon="lucide:clock" style={{ verticalAlign: -2 }} /> {event.time}</span>
        </div>
      </div>
      <span className="cat-pill">{event.catLabel}</span>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>a partir de</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 500, color: "var(--text-primary)" }}>
          {fmtBRL(event.priceFrom)}
        </div>
      </div>
      <span className="btn btn-navy btn-md">Comprar</span>
    </Link>
  );
}
