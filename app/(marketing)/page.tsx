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
      {/* sem JS, o título do hero fica visível (ele começa com opacity:0 pro
          reveal por linha não piscar) */}
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: ".home-hero__title{opacity:1 !important}" }} />
      </noscript>

      <section className="home-hero">
        <h1 className="home-hero__title" data-hero-title style={{ opacity: 0 }}>
          Todo evento que importa,<br />num lugar só.
        </h1>
      </section>

      {featured.length > 0 && <Carousel events={featured} />}

      <TicketDivider />

      {/* escolha um evento */}
      <section className="container" style={{ padding: "40px 48px 16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 className="h2" data-reveal-lines style={{ fontSize: 34 }}>
            Escolha um <span className="serif accent-gold">evento</span>
          </h2>
          <Link href="/agenda" data-reveal className="nav-link" style={{ fontSize: 14, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
            Ver agenda <Icon icon="lucide:arrow-right" />
          </Link>
        </div>
        <EventGrid events={events} />
      </section>

      <ProducerCTA />
    </>
  );
}
