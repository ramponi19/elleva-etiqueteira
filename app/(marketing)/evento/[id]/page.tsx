import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Icon from "@/components/shared/icon";
import TicketSelector from "@/components/marketing/ticket-selector";
import { getEvent, getEventSlugs } from "@/lib/events";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  return slugs.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getEvent(id);
  return { title: data?.event.title ?? "Evento" };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getEvent(id);
  if (!data) notFound();
  const { event, tiers } = data;

  return (
    <div className="container" style={{ padding: "32px 48px 64px" }}>
      <Link href="/agenda" className="nav-link" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-tertiary)", marginBottom: 24 }}>
        <Icon icon="lucide:arrow-left" /> Voltar para a agenda
      </Link>

      <div className="event-layout" style={{ marginTop: 8 }}>
        {/* left: banner + info */}
        <div>
          <div className="banner" style={event.cover ? { padding: 0 } : undefined}>
            {event.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.cover} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <div className="banner-glow" />
                <Icon icon={event.icon} style={{ fontSize: 72, color: "var(--gold-500)", position: "relative" }} />
                <span className="poster-label" style={{ position: "relative" }}>BANNER 16:9</span>
              </>
            )}
          </div>

          <span className="eyebrow eyebrow-gold" style={{ marginTop: 32 }}>{event.catLabel}</span>
          <h1 className="h1" style={{ fontSize: 44, marginTop: 16 }}>{event.title}</h1>

          <div className="meta-row">
            <div className="meta-chip">
              <Icon icon="solar:calendar-bold-duotone" style={{ fontSize: 22, color: "var(--text-gold)" }} />
              <div><div className="k">DATA</div><div className="v">{event.dateFull}</div></div>
            </div>
            <div className="meta-chip">
              <Icon icon="solar:clock-circle-bold-duotone" style={{ fontSize: 22, color: "var(--text-gold)" }} />
              <div><div className="k">HORÁRIO</div><div className="v">{event.time}</div></div>
            </div>
            <div className="meta-chip">
              <Icon icon="solar:map-point-bold-duotone" style={{ fontSize: 22, color: "var(--text-gold)" }} />
              <div><div className="k">LOCAL</div><div className="v">{event.venueCity}</div></div>
            </div>
          </div>

          <h3 className="h3" style={{ fontSize: 24, marginTop: 36 }}>Sobre o evento</h3>
          <p className="body-lg" style={{ marginTop: 12, maxWidth: 560 }}>{event.desc}</p>
          <p className="body" style={{ marginTop: 14, maxWidth: 560 }}>
            Abertura dos portões uma hora antes. Evento sujeito à classificação indicativa. Ingressos não
            reembolsáveis após a confirmação, conforme política de compra.
          </p>
        </div>

        {/* right: ticket selector */}
        <TicketSelector event={event} tiers={tiers} />
      </div>
    </div>
  );
}
