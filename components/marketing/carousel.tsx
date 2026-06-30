"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/shared/icon";
import type { EventItem } from "@/lib/events";

export default function Carousel({ events }: { events: EventItem[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (events.length < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % events.length), 8000);
    return () => clearInterval(timer);
  }, [events.length]);

  const event = events[active];
  if (!event) return null;

  return (
    <section className="container" style={{ padding: "48px 48px 24px" }}>
      <div className="hero-stage">
        <div className="hero-glow" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div>
            <span className="eyebrow eyebrow-gold">Em cartaz · destaque da semana</span>
            <h1 className="h1 hero-title" style={{ marginTop: 20 }}>{event.title}</h1>
            <div className="hero-meta">
              <span>
                <Icon icon="lucide:calendar" style={{ verticalAlign: -2, color: "#D3BA83" }} /> {event.dateFull}
              </span>
              <span>
                <Icon icon="lucide:map-pin" style={{ verticalAlign: -2, color: "#D3BA83" }} /> {event.venueCity}
              </span>
            </div>
            <p className="hero-desc">{event.desc}</p>
            <div style={{ display: "flex", gap: 14, marginTop: 32 }}>
              <Link href={`/evento/${event.id}`} className="btn btn-gold btn-lg" style={{ boxShadow: "var(--sh-gold)" }}>
                Comprar ingressos
              </Link>
              <Link href="/agenda" className="btn btn-ghost-dark btn-lg">
                Ver agenda completa
              </Link>
            </div>
            {events.length > 1 && (
              <div className="hero-dots">
                {events.map((ev, i) => (
                  <button
                    key={ev.id}
                    type="button"
                    aria-label={`Ver ${ev.title}`}
                    onClick={() => setActive(i)}
                    className={i === active ? "active" : ""}
                    style={{ border: "none", padding: 0, cursor: "pointer" }}
                  />
                ))}
              </div>
            )}
          </div>

          <Link href={`/evento/${event.id}`} className="poster" style={event.cover ? { padding: 0, overflow: "hidden" } : undefined}>
            {event.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.cover} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <Icon icon={event.icon} style={{ fontSize: 64, color: "var(--gold-500)" }} />
                <span className="poster-label">PÔSTER 4:5</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
}
