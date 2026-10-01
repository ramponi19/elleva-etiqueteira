// ============================================================
// Agenda — visual claro (28/09/2026)
// ============================================================
// Mesmo cromo da home e do evento (cabeçalho/rodapé no layout da agenda).
// Título, cidades em pílulas e os eventos agrupados por mês com o CardEvento
// da home. A busca é a do cabeçalho (ela manda ?q= pra cá). A versão escura
// "A Noite" está no histórico do git (antes de 28/09) e em agenda.css.
import Link from "next/link";
import type { EventItem } from "@/lib/events";
import { CardEvento } from "@/components/elleva/clara/card-evento";

const MES_LONGO: Record<string, string> = {
  JAN: "Janeiro", FEV: "Fevereiro", MAR: "Março", ABR: "Abril", MAI: "Maio", JUN: "Junho",
  JUL: "Julho", AGO: "Agosto", SET: "Setembro", OUT: "Outubro", NOV: "Novembro", DEZ: "Dezembro",
};

function agruparPorMes(events: EventItem[]): [string, EventItem[]][] {
  const grupos = new Map<string, EventItem[]>();
  for (const e of events) { if (!grupos.has(e.mon)) grupos.set(e.mon, []); grupos.get(e.mon)!.push(e); }
  return [...grupos.entries()];
}

export function AgendaGrade({
  events, destaqueHeader, query,
}: {
  events: EventItem[];
  /** complemento do título ("em Mogi Guaçu"); na /agenda geral fica vazio */
  destaqueHeader?: string;
  cidadeAtiva?: string;
  query?: string;
}) {
  const grupos = agruparPorMes(events);

  return (
    <main className="wrap">
      <header className="ag-cab">
        {/* só "Eventos" (pedido do Lucas, 01/10): sem contagem e sem as pílulas de
            cidade. Nas páginas /agenda/<cidade> (vindas do Google/sitemap) o
            nome da cidade continua, para a lista filtrada fazer sentido. */}
        <h1>Eventos{destaqueHeader ? ` ${destaqueHeader}` : ""}</h1>
        {query && (
          <p className="ag-sub">
            Resultados para <strong>“{query}”</strong> · <Link href="/agenda">limpar busca</Link>
          </p>
        )}
      </header>

      {grupos.length === 0 ? (
        <p className="vazio ag-vazio">
          {query ? "Nenhum evento encontrado com essa busca. Tente outro nome ou cidade." : "Nenhum evento à venda por aqui ainda."}{" "}
          <Link href="/produtores">Quer publicar o seu?</Link>
        </p>
      ) : (
        grupos.map(([mes, lista], i) => (
          <section className={"bloco" + (i > 0 ? " divisa" : " ag-primeiro")} key={mes} aria-labelledby={`mes-${mes}`}>
            <div className="bloco-cab">
              <h2 id={`mes-${mes}`}>{MES_LONGO[mes] ?? mes}</h2>
            </div>
            <div className="grade">
              {lista.map((e) => <CardEvento key={e.id} e={e} />)}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
