import Link from "next/link";
import type { EventItem } from "@/lib/events";

export default function EventCard({ event }: { event: EventItem }) {
  return (
    <Link href={`/evento/${event.id}`} className="ev-card">
      <div className="ev-card__img" style={event.cover ? { padding: 0 } : undefined}>
        {event.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span className="ev-poster">
            <span className="ev-poster__cat">{event.catLabel}</span>
            <span className="ev-poster__title">{event.title}</span>
          </span>
        )}
        {event.soldOut && (
          <span className="ev-badge" style={{ left: "auto", right: 12, background: "rgba(214,69,69,.85)" }}>
            ESGOTADO
          </span>
        )}
      </div>
      <div className="ev-card__body">
        <div className="ev-date">{event.dateFull} · {event.time}</div>
        {event.cover && <div className="ev-name">{event.title}</div>}
        <div className="ev-venue">{event.venueCity}</div>
      </div>
    </Link>
  );
}
