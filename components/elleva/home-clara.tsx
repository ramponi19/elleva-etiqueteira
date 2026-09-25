// ============================================================
// Home clara — padrão de mercado (Seo Ingresso / Sympla / Ingresse)
// ============================================================
// Fundo branco; a cor vem da arte de cada evento. Ordem: cabeçalho com busca →
// outdoor dos destaques → categorias → grade de próximos eventos → como
// funciona → rodapé. Estilos em app/(home)/home-clara.css, escopo .eclara.
// Componente de servidor: só o outdoor, o "Entrar" e o menu da conta são
// client components.
import Image from "next/image";
import Link from "next/link";
import { LogoElleva } from "@/components/elleva/logo";
import { EntrarModal } from "@/components/elleva/entrar-modal";
import { MenuConta } from "@/components/elleva/menu-conta";
import { Outdoor, type SlideOutdoor } from "@/components/elleva/outdoor";
import type { ContaResumo } from "@/lib/auth";
import type { EventItem } from "@/lib/events";

// O outdoor mostra até 4 eventos
const MAX_OUTDOOR = 4;

function cidadeDe(venueCity: string) {
  const partes = venueCity.split(" · ");
  return partes[partes.length - 1] ?? venueCity;
}

const FUNDO: Record<string, string> = {
  SHOW: "g-show", FESTA: "g-festa", ESPORTE: "g-esporte", TEATRO: "g-teatro", CORPORATIVO: "g-corp", CURSO: "g-corp",
};
const ROTULO: Record<string, string> = {
  SHOW: "Show", FESTA: "Festa", ESPORTE: "Esporte", TEATRO: "Teatro", CORPORATIVO: "Corporativo", CURSO: "Curso",
};

const CATEGORIAS = [
  { q: "show", nome: "Shows", emoji: "🎤", cls: "c-show" },
  { q: "festa", nome: "Festas", emoji: "🪩", cls: "c-festa" },
  { q: "teatro", nome: "Teatro", emoji: "🎭", cls: "c-teatro" },
  { q: "esporte", nome: "Esporte", emoji: "⚽", cls: "c-esporte" },
  { q: "corporativo", nome: "Corporativo", emoji: "💼", cls: "c-corp" },
];

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
    quando: `${e.dateFull} · ${e.time}`,
    cidade: cidadeDe(e.venueCity),
    fundo: FUNDO[e.catLabel] ?? "g-show",
  }));

  return (
    <div className="eclara">
      <header className="topo">
        <div className="topo-in">
          <Link className="marca" href="/" aria-label="Elleva Tickets — início"><LogoElleva /></Link>
          <form className="busca" action="/agenda" role="search">
            <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" name="q" placeholder="Buscar evento ou cidade" aria-label="Buscar eventos" />
            <button type="submit">Buscar</button>
          </form>
          <nav className="topo-links" aria-label="Principal">
            <Link href="/agenda">Agenda</Link>
            <Link href="/produtores">Criar evento</Link>
            {conta ? <MenuConta conta={conta} claro /> : <EntrarModal className="entrar" />}
          </nav>
        </div>
      </header>

      <main>
        <Outdoor slides={slides} />

        <div className="wrap">
          <nav className="categorias" aria-label="Categorias">
            {CATEGORIAS.map((c) => (
              <Link key={c.q} href={`/agenda?q=${c.q}`} className="cat">
                <span className={"cat-ico " + c.cls} aria-hidden>{c.emoji}</span>
                {c.nome}
              </Link>
            ))}
            <Link href="/agenda" className="cat">
              <span className="cat-ico c-todos" aria-hidden>＋</span>
              Ver todos
            </Link>
          </nav>

          <section className="bloco" aria-labelledby="t-proximos">
            <div className="bloco-cab">
              <h2 id="t-proximos">Próximos eventos</h2>
              <Link href="/agenda" className="ver-tudo">Ver agenda completa</Link>
            </div>
            {events.length === 0 && (
              <p className="vazio">Nenhum evento à venda agora. Volte em breve — ou <Link href="/produtores">publique o seu</Link>.</p>
            )}
            <div className="grade">
              {events.map((e) => (
                <Link key={e.id} href={`/evento/${e.id}`} className="card">
                  <span className={"capa " + (e.cover ? "" : FUNDO[e.catLabel] ?? "g-show")}>
                    {e.cover ? (
                      <Image src={e.cover} alt="" fill sizes="(max-width: 760px) 100vw, (max-width: 1024px) 50vw, 400px" />
                    ) : (
                      <span className="capa-titulo" aria-hidden>{e.title}</span>
                    )}
                    <span className="selo-data" aria-hidden><b>{e.d}</b>{e.mon}</span>
                    {e.soldOut && <span className="selo-esgotado">Esgotado</span>}
                  </span>
                  <span className="card-cat">{ROTULO[e.catLabel] ?? e.catLabel}</span>
                  <strong className="card-titulo">{e.title}</strong>
                  <span className="card-info">{e.dateFull} · {e.time}</span>
                  <span className="card-info">{e.venueCity}</span>
                </Link>
              ))}
              <div className="card-produtor">
                <strong>Vai organizar um evento na região?</strong>
                <p>Publique, venda no Pix ou no cartão e faça a portaria pelo celular.</p>
                <Link href="/criar-evento" className="btn">Criar meu evento</Link>
              </div>
            </div>
          </section>

          <section className="bloco como" id="como" aria-labelledby="t-como">
            <h2 id="t-como">Como funciona</h2>
            <ol className="passos">
              <li><b>Escolha o ingresso</b><span>Pista, camarote ou o assento no mapa. O preço já aparece com a taxa somada.</span></li>
              <li><b>Pague no Pix ou no cartão</b><span>No Pix a confirmação é na hora. No cartão, em até 12x.</span></li>
              <li><b>Entre com o QR Code</b><span>O ingresso fica salvo na sua conta. Na portaria, é só apresentar.</span></li>
            </ol>
          </section>
        </div>
      </main>

      <footer className="rodape">
        <div className="wrap">
          <div className="rodape-grade">
            <div className="rodape-marca">
              <LogoElleva />
              <p>Ingressos para shows, festas, teatro, esporte e eventos corporativos no interior de SP e sul de MG.</p>
            </div>
            <div className="rodape-col">
              <h3>Elleva</h3>
              <Link prefetch={false} href="/agenda">Agenda</Link>
              <Link prefetch={false} href="/produtores">Para produtores</Link>
              <a href="#como">Como funciona</a>
              <Link prefetch={false} href="/ajuda">Central de ajuda</Link>
            </div>
            <div className="rodape-col">
              <h3>Legal</h3>
              <Link prefetch={false} href="/terms">Política de compras</Link>
              <Link prefetch={false} href="/privacy">Privacidade</Link>
            </div>
            <div className="rodape-col">
              <h3>Contato</h3>
              <a href="mailto:contato@ellevaeventos.com.br">contato@ellevaeventos.com.br</a>
            </div>
          </div>
          <p className="rodape-base">© 2026 Elleva Tickets</p>
        </div>
      </footer>
    </div>
  );
}
