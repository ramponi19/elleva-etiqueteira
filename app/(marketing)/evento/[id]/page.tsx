import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Duotone } from "@/components/ui/duotone";
import { CanhotoCheckout } from "@/components/elleva/canhoto-checkout";
import { getEvent, getEventSlugs } from "@/lib/events";
import { arteDaCategoria, duotoneDaCategoria, numeroSerie } from "@/lib/arte";
import { cidadeDoEvento } from "@/lib/cidades";
import { fmtBRL } from "@/lib/format";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic"; // canhoto depende do login

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
  if (!data) return { title: "Evento" };
  const { event } = data;
  return {
    title: `${event.title} em ${cidadeDoEvento(event)} · ${event.dateFull} | Elleva Tickets`,
    description: `${event.venueCity} · a partir de ${fmtBRL(event.priceFrom)}. Garanta seu lugar na Elleva.`,
  };
}

function Notch({ pos }: { pos: "cima" | "baixo" }) {
  return (
    <span
      aria-hidden
      className="absolute right-[-10px] z-10 h-[18px] w-[18px] rounded-full border-[1.5px] border-tinta bg-papel"
      style={pos === "cima" ? { top: 26 } : { bottom: 26 }}
    />
  );
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, { user }] = await Promise.all([getEvent(id), getAuth()]);
  if (!data) notFound();
  const { event, tiers } = data;
  const arte = arteDaCategoria(event.catLabel);
  const serie = numeroSerie(event.serial);
  const cidade = cidadeDoEvento(event);

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-20 pt-8 sm:px-10">
      <Link href="/agenda" className="rotulo text-sol-escuro hover:text-sol">
        ← Agenda
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.35fr_1fr]">
        {/* CARTAZ */}
        <article className="relative">
          <Notch pos="cima" />
          <Notch pos="baixo" />
          <div
            className="relative flex min-h-[440px] flex-col overflow-hidden rounded-[var(--radius-card)] border-[1.5px] border-tinta"
            style={{ background: arte.bg, color: arte.fg }}
          >
            {event.cover && (
              <div className="absolute inset-0">
                <Duotone
                  src={event.cover}
                  alt=""
                  tone={duotoneDaCategoria(event.catLabel)}
                  className="h-full w-full"
                  priority
                  sizes="(max-width: 1024px) 100vw, 640px"
                />
              </div>
            )}
            <div
              className="relative z-[1] flex flex-1 flex-col p-6 sm:p-8"
              style={event.cover ? { color: "var(--color-papel)" } : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <Badge tom={event.cover || !arte.clara ? "papel" : "tinta"}>
                  {event.catLabel}
                </Badge>
                <span className="rotulo opacity-80">Nº {serie}</span>
              </div>

              <h1 className="display-1 mt-auto max-w-[14ch] pt-10 text-[clamp(34px,4.5vw,60px)]">
                {event.title}
              </h1>
              {event.desc && (
                <p className="corpo mt-4 max-w-[52ch]" style={{ color: "inherit" }}>
                  {event.desc}
                </p>
              )}

              <div
                className="mt-6 flex items-center gap-4 border-t-[1.5px] pt-4"
                style={{ borderColor: "currentcolor" }}
              >
                <span className="numero text-[28px]">
                  {event.d} {event.mon}
                </span>
                <span aria-hidden className="h-6 w-[1.5px] bg-current" />
                <span className="rotulo">{cidade}</span>
                <span aria-hidden className="h-6 w-[1.5px] bg-current" />
                <span className="rotulo">{event.time}</span>
              </div>
            </div>
          </div>
        </article>

        {/* CANHOTO */}
        <CanhotoCheckout event={event} tiers={tiers} loggedIn={!!user} />
      </div>

      {/* ABAIXO DO PICOTE — informação fria */}
      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.35fr_1fr]">
        <section>
          <h2 className="display-2 text-[24px]">Sobre o evento</h2>
          <p className="corpo mt-4 max-w-[62ch]">{event.desc}</p>
          <p className="corpo-suave mt-4 max-w-[62ch]">
            Abertura dos portões uma hora antes. Evento sujeito à classificação
            indicativa. Ingressos não reembolsáveis após a confirmação, conforme
            a política de compras.
          </p>
        </section>
        <section className="flex flex-col gap-6">
          <div className="rounded-[var(--radius-card)] border-[1.5px] border-tinta p-5">
            <h3 className="rotulo m-0 text-sol-escuro">Meia-entrada</h3>
            <p className="corpo-suave m-0 mt-2">
              Estudantes, idosos e PCD pagam meia com documento na entrada.
              Leva o comprovante junto do ingresso.
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border-[1.5px] border-tinta p-5">
            <h3 className="rotulo m-0 text-sol-escuro">Organização</h3>
            <p className="corpo-suave m-0 mt-2">
              Evento produzido por parceiro local e vendido pela Elleva, a
              bilheteria oficial do interior. Dúvidas?{" "}
              <Link href="/ajuda" className="text-sol-escuro underline underline-offset-2">
                Central de Ajuda
              </Link>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
