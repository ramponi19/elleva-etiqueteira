import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Icon from "@/components/shared/icon";
import TicketPurchase from "@/components/marketing/ticket-purchase";
import { getEvent } from "@/lib/events";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic"; // depende do login do usuário

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getEvent(id);
  return { title: data ? `Ingressos · ${data.event.title}` : "Ingressos" };
}

export default async function IngressosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getEvent(id);
  if (!data) notFound();
  const { event, tiers } = data;
  const { user } = await getAuth();

  return (
    <div className="container" style={{ padding: "24px 48px 72px" }}>
      <div className="buy-steps">
        <b>Ingressos</b><span className="sep">·</span>
        <span>Acesso</span><span className="sep">·</span>
        <span>Pagamento</span>
      </div>

      <div className="buy-header">
        {event.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="buy-header__thumb" src={event.cover} alt={event.title} />
        ) : (
          <div className="buy-header__thumb" />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="buy-header__title">{event.title}</h1>
          <div className="buy-header__meta">
            <Icon icon="lucide:map-pin" /> {event.venueCity} · {event.dateFull} · {event.time}
          </div>
        </div>
        <Link href={`/evento/${event.id}`} className="buy-header__link">Ver página do evento</Link>
      </div>

      <TicketPurchase event={event} tiers={tiers} loggedIn={!!user} />
    </div>
  );
}
