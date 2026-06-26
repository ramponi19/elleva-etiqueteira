import Link from "next/link";
import Icon from "@/components/shared/icon";
import type { EventItem } from "@/lib/events";

export default function Hero({ event }: { event: EventItem }) {
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
            <div className="hero-dots">
              <span className="active" />
              <span /><span /><span />
            </div>
          </div>

          <Link href={`/evento/${event.id}`} className="poster">
            <Icon icon={event.icon} style={{ fontSize: 64, color: "var(--gold-500)" }} />
            <span className="poster-label">PÔSTER 4:5</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
