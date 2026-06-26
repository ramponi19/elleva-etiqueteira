import Link from "next/link";
import Hero from "@/components/marketing/hero";
import EventCard from "@/components/marketing/event-card";
import ProducerCTA from "@/components/marketing/producer-cta";
import Icon from "@/components/shared/icon";
import { getEvents, CATEGORIES } from "@/lib/events";

export const revalidate = 300;

export default async function HomePage() {
  const events = await getEvents();
  const featured = events[0];

  return (
    <>
      {featured && <Hero event={featured} />}

      {/* more events */}
      <section className="container" style={{ padding: "40px 48px 16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 className="h2" style={{ fontSize: 34 }}>
            Mais <span className="serif accent-gold">eventos</span>
          </h2>
          <Link href="/agenda" className="nav-link" style={{ fontSize: 14, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
            Ver agenda <Icon icon="lucide:arrow-right" />
          </Link>
        </div>
        <div className="ev-grid">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      </section>

      {/* categories */}
      <section className="container" style={{ padding: "48px 48px 16px" }}>
        <h2 className="h2" style={{ fontSize: 30, marginBottom: 22 }}>
          Navegue por <span className="serif accent-gold">categoria</span>
        </h2>
        <div className="chips">
          {CATEGORIES.map((c, i) => (
            <Link key={c} href="/agenda" className={`chip${i === 0 ? " chip--active" : ""}`}>
              {c}
            </Link>
          ))}
        </div>
      </section>

      <ProducerCTA />
    </>
  );
}
