import Link from "next/link";
import Icon from "@/components/shared/icon";
import { Marquee } from "@/components/ui/marquee";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/elleva/ticket-card";
import { becomeProducerAndGo } from "@/lib/actions/producer";
import { getEvents } from "@/lib/events";

export const revalidate = 300;

const CIDADES_MARQUEE = [
  "Mogi Guaçu",
  "Mogi Mirim",
  "Itapira",
  "Americana",
  "Sul de MG",
  "Hoje tem show",
];

export default async function HomePage() {
  const events = await getEvents();

  return (
    <>
      <Marquee itens={CIDADES_MARQUEE} />

      {/* HERO — alinhado à esquerda (spec 8.1) */}
      <section className="mx-auto max-w-[1320px] px-5 pb-4 pt-14 sm:px-10 sm:pt-20">
        {/* sem data-reveal no hero: é o LCP — esconder/reanimar acima da
            dobra empurra o LCP pra depois do JS (Lighthouse caiu de 90+ pra
            80 por isso). Reveal fica só nas seções abaixo da dobra (§9). */}
        <p className="rotulo m-0 text-sol-escuro">
          Bilheteria oficial · Interior de SP e Sul de MG
        </p>
        <h1 className="display-1 mt-4 max-w-[13ch]">
          O palco do <span className="text-sol">interior</span> é aqui
        </h1>
        <p className="corpo mt-5 max-w-[46ch]">
          Shows, festas, teatro e esporte na sua cidade. Sem taxa escondida,
          sem fila, sem drama.
        </p>

        <form
          action="/agenda"
          className="mt-7 flex max-w-[440px] items-center gap-1.5 rounded-[var(--radius-pill)] border-[1.5px] border-tinta bg-white p-1.5"
        >
          <input
            type="search"
            name="q"
            placeholder="Buscar show, festa, teatro…"
            aria-label="Buscar evento"
            className="w-full min-w-0 border-none bg-transparent px-3 py-2 text-[15px] text-tinta outline-none placeholder:text-tinta-35 focus-visible:outline-none"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-tinta text-papel transition-colors duration-[var(--dur-micro)] hover:bg-sol-escuro"
          >
            <Icon icon="lucide:search" style={{ fontSize: 17 }} />
          </button>
        </form>
      </section>

      {/* EM CARTAZ */}
      <section className="mx-auto max-w-[1320px] px-5 pb-6 pt-14 sm:px-10">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="display-2" data-reveal>Em cartaz</h2>
          <Link
            href="/agenda"
            className="rotulo text-sol-escuro hover:text-sol"
            data-reveal
          >
            Ver agenda →
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="corpo max-w-[46ch]">
            Nada em cartaz por aqui ainda. Avisa um produtor ou traz o seu evento.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            {events.map((e, i) => (
              <TicketCard
                key={e.id}
                href={`/evento/${e.id}`}
                titulo={e.title}
                categoria={e.catLabel}
                data={`${e.dateFull} · ${e.time}`}
                local={e.venueCity}
                precoDesde={e.priceFrom}
                cover={e.cover}
                esgotado={e.soldOut}
                prioridade={i === 0}
              />
            ))}
          </div>
        )}
      </section>

      {/* PRODUTORES — bloco tinta full-width */}
      <section id="produtores" className="mt-16 bg-tinta py-16 sm:py-20">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-7 px-5 sm:px-10">
          <p className="rotulo m-0 text-papel/60">Pra quem faz o evento</p>
          <h2 className="display-2 max-w-[16ch] text-papel" data-reveal>
            Seu evento merece <span className="text-cartaz">casa cheia</span>
          </h2>
          <p className="corpo max-w-[46ch] text-papel/80">
            Publica na Elleva, vende com Pix na hora e acompanha o público em
            tempo real. A divulgação regional é por nossa conta.
          </p>
          <form action={becomeProducerAndGo}>
            <input type="hidden" name="to" value="/produtor/eventos/novo" />
            <Button type="submit">Publicar evento na Elleva →</Button>
          </form>
        </div>
      </section>
    </>
  );
}
