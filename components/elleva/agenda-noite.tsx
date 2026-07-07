import Icon from "@/components/shared/icon";
import { CityPills } from "@/components/elleva/city-pills";
import { EventStubRow } from "@/components/elleva/event-stub-row";
import { CIDADES } from "@/lib/cidades";
import type { EventItem } from "@/lib/events";

// Agenda no modo noite (spec 8.2 + §14): fundo tinta via data-theme="noite",
// header "HOJE TEM…", CityPills e EventStubRows agrupadas por mês.
// A lua em cartaz é marcador do modo, não botão.

const MES_LONGO: Record<string, string> = {
  JAN: "Janeiro", FEV: "Fevereiro", MAR: "Março", ABR: "Abril",
  MAI: "Maio", JUN: "Junho", JUL: "Julho", AGO: "Agosto",
  SET: "Setembro", OUT: "Outubro", NOV: "Novembro", DEZ: "Dezembro",
};

function agruparPorMes(events: EventItem[]): [string, EventItem[]][] {
  const grupos = new Map<string, EventItem[]>();
  for (const e of events) {
    const key = e.mon;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(e);
  }
  return [...grupos.entries()];
}

export function AgendaNoite({
  events,
  destaqueHeader,
  cidadeAtiva,
  query,
}: {
  events: EventItem[];
  /** vai colorido de sol no header, ex. "Mogi Guaçu" ou "no interior" */
  destaqueHeader: string;
  /** slug da cidade ativa nas pills; undefined = "Todas" */
  cidadeAtiva?: string;
  query?: string;
}) {
  const grupos = agruparPorMes(events);
  const pills = [
    { label: "Todas", href: "/agenda", ativa: !cidadeAtiva },
    ...CIDADES.map((c) => ({
      label: c.nome,
      href: `/agenda/${c.slug}`,
      ativa: cidadeAtiva === c.slug,
    })),
  ];

  return (
    <div data-theme="noite" className="min-h-[70vh]">
      <div className="mx-auto max-w-[1100px] px-5 pb-20 pt-12 sm:px-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="rotulo m-0 text-cartaz">Agenda · modo noite</p>
            <h1 className="display-2 mt-3 text-papel">
              Hoje tem <span className="text-sol">{destaqueHeader}</span>
            </h1>
          </div>
          <span aria-hidden className="mt-1 text-cartaz">
            <Icon icon="lucide:moon" style={{ fontSize: 22 }} />
          </span>
        </div>

        <div id="cidades" className="mt-8 scroll-mt-24">
          <CityPills cidades={pills} />
        </div>

        {query && (
          <p className="corpo-suave mt-6">
            Resultados para <strong className="text-papel">“{query}”</strong> —{" "}
            <a href="/agenda" className="underline underline-offset-2">limpar busca</a>
          </p>
        )}

        {grupos.length === 0 ? (
          <p className="corpo mt-10 max-w-[46ch] text-papel">
            Nada em cartaz por aqui ainda. Avisa um produtor ou{" "}
            <a href="/#produtores" className="text-cartaz underline underline-offset-2">
              traz o seu evento
            </a>.
          </p>
        ) : (
          grupos.map(([mes, lista]) => (
            <section key={mes} className="mt-10">
              <h2 className="rotulo m-0 mb-4 text-papel/60">
                {MES_LONGO[mes] ?? mes}
              </h2>
              <div className="flex flex-col gap-3">
                {lista.map((e) => (
                  <EventStubRow
                    key={e.id}
                    href={`/evento/${e.id}`}
                    titulo={e.title}
                    categoria={e.catLabel}
                    dia={e.d}
                    mes={e.mon}
                    meta={`${e.time} · ${e.venueCity}`}
                    precoDesde={e.priceFrom}
                    esgotado={e.soldOut}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
