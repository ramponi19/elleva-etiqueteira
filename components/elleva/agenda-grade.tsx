import Link from "next/link";
import { CIDADES } from "@/lib/cidades";
import type { EventItem } from "@/lib/events";

const MES_LONGO: Record<string, string> = {
  JAN: "Janeiro", FEV: "Fevereiro", MAR: "Março", ABR: "Abril", MAI: "Maio", JUN: "Junho",
  JUL: "Julho", AGO: "Agosto", SET: "Setembro", OUT: "Outubro", NOV: "Novembro", DEZ: "Dezembro",
};
function genre(label: string) {
  const l = (label || "").toLowerCase();
  if (/festa|balada/.test(l)) return "g-festa";
  if (/esporte/.test(l)) return "g-esporte";
  if (/teatro|cultura|espet/.test(l)) return "g-teatro";
  if (/corp|congresso|curso|palestra|summit/.test(l)) return "g-corp";
  return "g-show";
}
const fmt = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");

function agruparPorMes(events: EventItem[]): [string, EventItem[]][] {
  const grupos = new Map<string, EventItem[]>();
  for (const e of events) { if (!grupos.has(e.mon)) grupos.set(e.mon, []); grupos.get(e.mon)!.push(e); }
  return [...grupos.entries()];
}

export function AgendaGrade({
  events, destaqueHeader, cidadeAtiva, query,
}: {
  events: EventItem[];
  destaqueHeader: string;
  cidadeAtiva?: string;
  query?: string;
}) {
  const grupos = agruparPorMes(events);
  const pills = [
    { label: "Todas", href: "/agenda", on: !cidadeAtiva },
    ...CIDADES.map((c) => ({ label: c.nome, href: `/agenda/${c.slug}`, on: cidadeAtiva === c.slug })),
  ];

  return (
    <main className="wrap">
      <header className="head">
        <div className="eyebrow">Agenda</div>
        <h1>O que tá <span className="em">rolando</span> {destaqueHeader}</h1>

        <div className="filters">
          <div className="fsearch">
            <form action="/agenda">
              <input name="q" defaultValue={query ?? ""} placeholder="Buscar evento, artista ou cidade…" aria-label="Buscar evento" />
              <button type="submit" aria-label="Buscar">→</button>
            </form>
          </div>
          <div className="pills">
            {pills.map((p) => (
              <Link key={p.href} href={p.href} className={"pill" + (p.on ? " on" : "")}>{p.label}</Link>
            ))}
          </div>
        </div>

        {query && (
          <p className="qinfo">Resultados para <strong>“{query}”</strong> — <Link href="/agenda">limpar busca</Link></p>
        )}
      </header>

      {grupos.length === 0 ? (
        <p className="empty">Nada em cartaz por aqui ainda. Avisa um produtor ou <Link href="/#produtores">traz o seu evento</Link>.</p>
      ) : (
        grupos.map(([mes, lista]) => (
          <section className="mes" key={mes}>
            <h2>{MES_LONGO[mes] ?? mes}</h2>
            <div className="grid">
              {lista.map((e) => (
                <Link className="card" key={e.id} href={`/evento/${e.id}`}>
                  <div className={"bg " + (e.cover ? "" : genre(e.catLabel))} style={e.cover ? { backgroundImage: `url(${e.cover})` } : undefined} />
                  {!e.cover && <span className="ghost">{e.catLabel.slice(0, 4)}</span>}
                  <div className="scrim" />
                  <div className="pc">
                    <div>
                      <span className="ptag">{e.catLabel}</span>
                      {e.soldOut && <div className="esg">Esgotado</div>}
                    </div>
                    <div>
                      <h3 className="ttl">{e.title}</h3>
                      <div className="meta">
                        <div><div className="when">{e.d} {e.mon} · {e.time}</div><div className="venue">{e.venueCity}</div></div>
                        <div className="price">{fmt(e.priceFrom)}<small> +taxa</small></div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
