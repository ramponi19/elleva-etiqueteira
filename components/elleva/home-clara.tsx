// ============================================================
// Home clara — padrão de mercado (Seo Ingresso / Sympla / Ingresse)
// ============================================================
// Fundo branco; a cor vem da arte de cada evento. Ordem: cabeçalho com busca →
// outdoor dos destaques → grade de eventos → rodapé ("menos é mais", 28/09:
// saíram categorias, o card "Vai organizar um evento?" e "Como funciona").
// Cabeçalho, rodapé e card vêm de components/elleva/clara (os mesmos da página
// do evento); estilos em clara/clara.css + app/(home)/home-clara.css (outdoor).
// Componente de servidor: só o outdoor, o "Entrar" e o menu da conta são
// client components.
import Link from "next/link";
import { Outdoor, type SlideOutdoor } from "@/components/elleva/outdoor";
import { CabecalhoClaro } from "@/components/elleva/clara/cabecalho";
import { RodapeClaro } from "@/components/elleva/clara/rodape";
import { CardEvento } from "@/components/elleva/clara/card-evento";
import type { ContaResumo } from "@/lib/auth";
import type { EventItem } from "@/lib/events";
import { FUNDO, ROTULO, cidadeUF, dataExtensa } from "@/lib/evento-formato";

// O outdoor mostra até 7 eventos: 1 no centro + até 3 cartões empilhados de
// cada lado, sem repetir evento (menos eventos = pilha menor)
const MAX_OUTDOOR = 7;

export default function HomeClara({ events, conta }: { events: EventItem[]; conta: ContaResumo | null }) {
  // Destaques escolhidos no admin vêm primeiro; sem nenhum, os mais próximos.
  // getEvents já traz só eventos futuros, do mais próximo pro mais distante.
  const destacados = events.filter((e) => e.featured).sort((a, b) => a.featuredOrder - b.featuredOrder);
  const doOutdoor = (destacados.length ? destacados : events).slice(0, MAX_OUTDOOR);
  const slides: SlideOutdoor[] = doOutdoor.map((e) => ({
    id: e.id,
    title: e.title,
    cover: e.cover,
    catLabel: ROTULO[e.catLabel] ?? e.catLabel,
    quando: dataExtensa(e.startsAtISO),
    cidade: cidadeUF(e),
    local: cidadeUF(e),
    fundo: FUNDO[e.catLabel] ?? "g-show",
  }));

  return (
    <div className="eclara">
      <CabecalhoClaro conta={conta} />

      <main>
        <Outdoor slides={slides} />

        <div className="wrap">
          <section className="bloco divisa" aria-labelledby="t-proximos">
            <div className="bloco-cab">
              <h2 id="t-proximos">Eventos</h2>
              <Link href="/agenda" className="ver-tudo">Ver agenda completa</Link>
            </div>
            {events.length === 0 && (
              <p className="vazio">Nenhum evento à venda agora. Volte em breve — ou <Link href="/produtores">publique o seu</Link>.</p>
            )}
            <div className="grade">
              {events.map((e) => <CardEvento key={e.id} e={e} />)}
            </div>
          </section>
        </div>
      </main>

      <RodapeClaro />
    </div>
  );
}
