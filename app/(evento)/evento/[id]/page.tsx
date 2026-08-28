import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEvent, getEventSlugs, getEvents } from "@/lib/events";
import { getAuth } from "@/lib/auth";
import { cidadeDoEvento } from "@/lib/cidades";
import { fmtBRL } from "@/lib/format";
import { toPlainText } from "@/lib/sanitize";
import { EventTracking } from "@/components/elleva/event-tracking";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";
import EventoNoite from "@/components/elleva/evento-noite";

export const dynamic = "force-dynamic"; // depende do login

export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  return slugs.map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getEvent(id);
  if (!data) return { title: "Evento" };
  const { event } = data;
  const title = `${event.title} em ${cidadeDoEvento(event)} · ${event.dateFull} | Elleva Tickets`;
  const description = `${event.venueCity} · a partir de ${fmtBRL(event.priceFrom)}. Garanta seu lugar na Elleva.`;
  const ogImage = `/api/og/evento/${event.id}`;
  return {
    title, description,
    openGraph: { title, description, images: [{ url: ogImage, width: 1200, height: 630, alt: event.title }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function EventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, { user }, todos] = await Promise.all([getEvent(id), getAuth(), getEvents()]);
  if (!data) notFound();
  const { event, tiers } = data;
  const saleClosed = data.saleClosed ?? false;
  const relacionados = todos.filter((e) => e.id !== event.id).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.startsAtISO,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: toPlainText(event.desc) || undefined,
    image: [`${SITE_URL}/api/og/evento/${event.id}`],
    location: {
      "@type": "Place",
      name: event.venueCity.split("·")[0]?.trim() ?? event.venueCity,
      address: { "@type": "PostalAddress", addressLocality: cidadeDoEvento(event), addressCountry: "BR" },
    },
    offers: {
      "@type": "AggregateOffer",
      url: `${SITE_URL}/evento/${event.id}`,
      priceCurrency: "BRL",
      lowPrice: event.priceFrom,
      availability: event.soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
    organizer: { "@type": "Organization", name: "Elleva Tickets", url: SITE_URL },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <EventTracking metaPixel={event.trackingMetaPixel} ga={event.trackingGa} />
      <EventoNoite event={event} tiers={tiers} loggedIn={!!user} relacionados={relacionados} saleClosed={saleClosed} />
    </>
  );
}
