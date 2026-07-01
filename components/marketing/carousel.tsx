"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { eventGradient } from "@/lib/event-theme";
import type { EventItem } from "@/lib/events";

function slideStyle(offset: number, total: number): React.CSSProperties {
  // normaliza o offset para o caminho mais curto (carrossel circular)
  let o = offset;
  if (o > total / 2) o -= total;
  if (o < -total / 2) o += total;
  const abs = Math.abs(o);

  let x: number, scale: number, opacity: number, z: number, blur: number;
  if (abs === 0) { x = -50; scale = 1; opacity = 1; z = 5; blur = 0; }
  else if (abs === 1) { x = o > 0 ? 38 : -138; scale = 0.8; opacity = 0.55; z = 3; blur = 0; }
  else if (abs === 2) { x = o > 0 ? 92 : -192; scale = 0.62; opacity = 0.3; z = 1; blur = 0.5; }
  else { x = o > 0 ? 130 : -230; scale = 0.5; opacity = 0; z = 0; blur = 2; }

  return {
    transform: `translate(${x}%, -50%) scale(${scale})`,
    opacity,
    zIndex: z,
    filter: `blur(${blur}px)`,
    pointerEvents: abs > 2 ? "none" : "auto",
  };
}

export default function Carousel({ events }: { events: EventItem[] }) {
  const [active, setActive] = useState(0);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = events.length;

  function restart() {
    if (timer.current) clearInterval(timer.current);
    if (total > 1) timer.current = setInterval(() => setActive((i) => (i + 1) % total), 8000);
  }

  useEffect(() => {
    restart();
    return () => { if (timer.current) clearInterval(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  function go(i: number) {
    setActive(((i % total) + total) % total);
    restart();
  }

  if (total === 0) return null;
  const current = events[active];

  return (
    <section className="carousel-section">
      <div className="carousel">
        {total > 1 && (
          <button className="car-arrow car-prev" onClick={() => go(active - 1)} aria-label="Anterior">
            <Icon icon="lucide:chevron-left" />
          </button>
        )}

        <div className="car-track">
          {events.map((ev, i) => (
            <button
              key={ev.id}
              className="car-slide"
              style={slideStyle(i - active, total)}
              onClick={() => (i === active ? router.push(`/evento/${ev.id}`) : go(i))}
              aria-label={ev.title}
            >
              {ev.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ev.cover} alt={ev.title} className="car-img" />
              ) : (
                <span className="car-art" style={{ backgroundImage: eventGradient(ev.catLabel) }}>
                  <span className="car-poster">
                    <span className="car-poster__cat">{ev.catLabel}</span>
                    <span className="car-poster__title">{ev.title}</span>
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>

        {total > 1 && (
          <button className="car-arrow car-next" onClick={() => go(active + 1)} aria-label="Próximo">
            <Icon icon="lucide:chevron-right" />
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="car-dots">
          {events.map((ev, i) => (
            <button
              key={ev.id}
              className={`car-dot${i === active ? " active" : ""}`}
              onClick={() => go(i)}
              aria-label={`Ir para ${ev.title}`}
            />
          ))}
        </div>
      )}

      <div className="car-caption">
        <h3 className="car-title">{current.title}</h3>
        <div className="car-meta">
          <span><Icon icon="lucide:map-pin" /> {current.venueCity}</span>
          <span><Icon icon="lucide:calendar" /> {current.dateFull} · {current.time}</span>
        </div>
      </div>
    </section>
  );
}
