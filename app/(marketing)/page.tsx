import Link from "next/link";
import Carousel from "@/components/marketing/carousel";
import EventGrid from "@/components/marketing/event-grid";
import ProducerCTA from "@/components/marketing/producer-cta";
import TicketDivider from "@/components/marketing/ticket-divider";
import Icon from "@/components/shared/icon";
import { getEvents, getFeaturedEvents } from "@/lib/events";

export const revalidate = 300;

export default async function HomePage() {
  const [events, featured] = await Promise.all([getEvents(), getFeaturedEvents()]);

  return (
    <>
      {featured.length > 0 && <Carousel events={featured} />}

      <TicketDivider />

      {/* escolha um evento */}
      <section className="container" style={{ padding: "40px 48px 16px" }}>
        <div data-reveal style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 className="h2" style={{ fontSize: 34 }}>
            Escolha um <span className="serif accent-gold">evento</span>
          </h2>
          <Link href="/agenda" className="nav-link" style={{ fontSize: 14, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
            Ver agenda <Icon icon="lucide:arrow-right" />
          </Link>
        </div>
        <EventGrid events={events} />
      </section>

      <ProducerCTA />
    </>
  );
}
