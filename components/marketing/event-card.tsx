import Link from "next/link";
import Icon from "@/components/shared/icon";
import { fmtBRL } from "@/lib/format";
import type { EventItem } from "@/lib/events";

export default function EventCard({ event }: { event: EventItem }) {
  return (
    <Link href={`/evento/${event.id}`} className="ev-card">
      <div className="ev-card__img" style={event.cover ? { padding: 0 } : undefined}>
        {event.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Icon icon={event.icon} style={{ fontSize: 42 }} />
        )}
        <span className="ev-badge">{event.catLabel}</span>
      </div>
      <div className="ev-card__body">
        <div className="ev-date">{event.dateFull} · {event.time}</div>
        <div className="ev-name">{event.title}</div>
        <div className="ev-venue">{event.venueCity}</div>
        <div className="ev-foot">
          <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
            a partir de{" "}
            <strong style={{ color: "var(--text-primary)", fontSize: 16 }}>{fmtBRL(event.priceFrom)}</strong>
          </span>
          <span className="btn btn-navy btn-sm">Comprar</span>
        </div>
      </div>
    </Link>
  );
}
