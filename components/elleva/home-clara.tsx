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

// O outdoor mostra até 7 eventos: 1 no centro + até 3 cartões empilhados de
// cada lado, sem repetir evento (menos eventos = pilha menor)
const MAX_OUTDOOR = 7;

/** "Mogi Guaçu - SP" (sem estado cadastrado: só a cidade) */
function cidadeUF(e: EventItem) {
  const partes = e.venueCity.split(" · ");
  const cidade = e.endereco?.cidade || partes[partes.length - 1] || e.venueCity;
  const uf = e.endereco?.uf?.trim().toUpperCase();
  return uf ? `${cidade} - ${uf}` : cidade;
}
/** "Teatro Municipal, Mogi Guaçu - SP" */
function localCompleto(e: EventItem) {
  const local = e.venueCity.split(" · ")[0];
  return local ? `${local}, ${cidadeUF(e)}` : cidadeUF(e);
}

// "Sábado, 21 de Nov às 21:00" — sempre no horário de Brasília (o servidor roda em UTC)
const FMT_DIA = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "short" });
const FMT_HORA = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
function dataExtensa(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(FMT_DIA.formatToParts(d).map((x) => [x.type, x.value]));
  const mes = maiuscula(String(p.month ?? "").replace(".", ""));
  return `${maiuscula(String(p.weekday ?? ""))}, ${p.day} de ${mes} às ${FMT_HORA.format(d)}`;
}

const FUNDO: Record<string, string> = {
  SHOW: "g-show", FESTA: "g-festa", ESPORTE: "g-esporte", TEATRO: "g-teatro", CORPORATIVO: "g-corp", CURSO: "g-corp",
};
const ROTULO: Record<string, string> = {
  SHOW: "Show", FESTA: "Festa", ESPORTE: "Esporte", TEATRO: "Teatro", CORPORATIVO: "Corporativo", CURSO: "Curso",
};

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
          <section className="bloco" aria-labelledby="t-proximos">
            <div className="bloco-cab">
              <h2 id="t-proximos">Eventos</h2>
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
                  <strong className="card-titulo">{e.title}</strong>
                  <span className="card-info">{localCompleto(e)}</span>
                  <span className="card-info">{dataExtensa(e.startsAtISO)}</span>
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
