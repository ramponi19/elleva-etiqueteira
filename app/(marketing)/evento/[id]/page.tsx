import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Icon from "@/components/shared/icon";
import { getEvent, getEventSlugs } from "@/lib/events";
import { eventGradient } from "@/lib/event-theme";

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
  const { event } = data;

  return (
    <div className="container" style={{ padding: "32px 48px 72px", maxWidth: 900 }}>
      <Link href="/agenda" className="nav-link" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-tertiary)", marginBottom: 24 }}>
        <Icon icon="lucide:arrow-left" /> Voltar para a agenda
      </Link>

      <div className="banner" data-reveal style={event.cover ? { padding: 0 } : undefined}>
        {event.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div className="banner-poster" style={{ backgroundImage: eventGradient(event.catLabel) }}>
            <span className="banner-poster__cat">{event.catLabel}</span>
            <span className="banner-poster__title">{event.title}</span>
          </div>
        )}
      </div>

      <span className="eyebrow eyebrow-gold" style={{ marginTop: 32 }}>{event.catLabel}</span>
      <h1 className="h1" data-reveal-lines style={{ fontSize: 44, marginTop: 16 }}>{event.title}</h1>

      <div className="meta-row" data-reveal>
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

      {/* CTA de compra */}
      <div data-reveal style={{ marginTop: 32, paddingTop: 28, borderTop: "1px solid var(--border)" }}>
        <Link href={`/evento/${event.id}/ingressos`} className="btn btn-gold btn-lg">
          Comprar ingresso <Icon icon="lucide:arrow-right" />
        </Link>
      </div>

      <h3 className="h3" data-reveal style={{ fontSize: 24, marginTop: 44 }}>Sobre o evento</h3>
      <p className="body-lg" data-reveal style={{ marginTop: 12, maxWidth: 620 }}>{event.desc}</p>
      <p className="body" style={{ marginTop: 14, maxWidth: 620 }}>
        Abertura dos portões uma hora antes. Evento sujeito à classificação indicativa. Ingressos não
        reembolsáveis após a confirmação, conforme política de compra.
      </p>
    </div>
  );
}
