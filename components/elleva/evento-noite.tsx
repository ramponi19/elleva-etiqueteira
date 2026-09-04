"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoElleva } from "@/components/elleva/logo";
import { EntrarModal } from "@/components/elleva/entrar-modal";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCart } from "@/lib/cart";
import { feeUnit, round2 } from "@/lib/fees";
import { sanitizeRichText } from "@/lib/sanitize";
import type { EventItem, Tier } from "@/lib/events";

const AuthModal = dynamic(() => import("@/components/marketing/auth-modal"), { ssr: false });

function genreOf(label: string) {
  const l = (label || "").toLowerCase();
  if (/festa|balada/.test(l)) return { key: "Festa", cls: "g-festa" };
  if (/esporte/.test(l)) return { key: "Esporte", cls: "g-esporte" };
  if (/teatro|cultura|espet/.test(l)) return { key: "Teatro", cls: "g-teatro" };
  if (/corp|congresso|curso|palestra|summit/.test(l)) return { key: "Corp", cls: "g-corp" };
  return { key: "Show", cls: "g-show" };
}
const fmt2 = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function EventoNoite({
  event,
  tiers,
  loggedIn,
  relacionados,
  saleClosed,
}: {
  event: EventItem;
  tiers: Tier[];
  loggedIn: boolean;
  relacionados: EventItem[];
  saleClosed: boolean;
}) {
  const router = useRouter();
  const { addItems } = useCart();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [showAuth, setShowAuth] = useState(false);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const nav = document.getElementById("eevnav");
    const onScroll = () => nav?.classList.toggle("solid", scrollY > 40);
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  const gen = genreOf(event.catLabel);
  const absorve = !!event.absorbFee;
  const maxParcelas = event.maxInstallments ?? 12;
  const ingressos = tiers.filter((t) => !t.isAddon);
  const adicionais = tiers.filter((t) => t.isAddon);

  const inc = (t: Tier) =>
    setQty((q) => {
      const n = (q[t.id] || 0) + 1;
      if (t.available != null && n > t.available) return q;
      return { ...q, [t.id]: n };
    });
  const dec = (id: string) => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));

  const selec = tiers.filter((t) => (qty[t.id] || 0) > 0);
  const count = selec.reduce((a, t) => a + qty[t.id], 0);
  const subtotal = round2(selec.reduce((a, t) => a + qty[t.id] * t.price, 0));
  const taxa = absorve ? 0 : round2(selec.reduce((a, t) => a + qty[t.id] * feeUnit(t.price, event.feePct), 0));
  const total = round2(subtotal + taxa);

  function proceed() {
    addItems(
      selec.map((t) => ({
        eventId: event.uuid, eventSlug: event.id, eventTitle: event.title,
        tierId: t.id, tierName: t.name, price: t.price, qty: qty[t.id],
        feePct: event.feePct, absorbFee: absorve, maxInstallments: maxParcelas,
      }))
    );
    router.push("/checkout");
  }
  function prosseguir() {
    if (count === 0) return;
    if (loggedIn) proceed();
    else setShowAuth(true);
  }

  const end = event.endereco;
  const enderecoLinha = [
    [end?.logradouro, end?.numero].filter(Boolean).join(", "),
    end?.complemento, end?.bairro, end?.cep,
  ].filter((p) => p && String(p).trim()).join(" · ");
  const buscaMapa = enderecoLinha ? `${event.venueCity} ${enderecoLinha}` : event.venueCity;

  const tierRow = (t: Tier) => {
    const esgotado = t.available != null && t.available <= 0;
    const poucos = t.available != null && t.available > 0 && t.available <= 10;
    const noMax = t.available != null && (qty[t.id] || 0) >= t.available;
    return (
      <div className={"tier" + (esgotado ? " off" : "")} key={t.id}>
        <div className="ti">
          <div className="tn">
            {t.name}
            {t.isHalf && <span className="badge">Meia</span>}
            {esgotado && <span className="badge">Esgotado</span>}
            {!esgotado && poucos && <span className="badge hot">Últimas</span>}
          </div>
          <div className="tp">{fmt2(t.price)}</div>
          {t.desc && <div className="td">{t.desc}</div>}
        </div>
        {!esgotado && (
          <div className="step">
            <button type="button" aria-label={`Tirar ${t.name}`} disabled={(qty[t.id] || 0) === 0} onClick={() => dec(t.id)}>−</button>
            <span className="q">{qty[t.id] || 0}</span>
            <button type="button" aria-label={`Adicionar ${t.name}`} disabled={noMax} onClick={() => inc(t)}>+</button>
          </div>
        )}
      </div>
    );
  };

  const buyInner = saleClosed ? (
    <div className="closed"><b>Vendas encerradas</b><span>Este evento já aconteceu.</span></div>
  ) : (
    <>
      <div>
        {ingressos.map(tierRow)}
        {adicionais.length > 0 && adicionais.map(tierRow)}
      </div>
      <div className="bsum">
        <div className="brow"><span>Subtotal</span><span>{fmt2(subtotal)}</span></div>
        <div className="brow"><span>Taxa</span><span>{absorve ? "inclusa" : fmt2(taxa)}</span></div>
        <div className="btot"><span className="tl">Total</span><span className="tv">{fmt2(total)}</span></div>
      </div>
      {total > 0 && maxParcelas > 1 && <div className="parc">ou em até {maxParcelas}x no cartão</div>}
      <div className="bfoot">
        <button type="button" className="btn btn-warm" disabled={count === 0} onClick={prosseguir}>Garantir ingresso →</button>
      </div>
    </>
  );

  return (
    <div className="eev">
      <div className="amb" aria-hidden />
      <div className="grain" aria-hidden />

      <nav className="top" id="eevnav">
        <div className="nav-in">
          <Link className="brand" href="/" aria-label="Elleva Tickets"><LogoElleva /></Link>
          <Link className="nav-back" href="/agenda">← Agenda</Link>
          <div className="nav-right">
            {loggedIn ? <Link className="entrar" href="/conta">Minha conta</Link> : <EntrarModal className="entrar" />}
            {!saleClosed && <a className="mini" href="#buy">Garantir ingresso</a>}
          </div>
        </div>
      </nav>

      <header className="cover">
        <div className={"art " + (event.cover ? "" : gen.cls)} style={event.cover ? { backgroundImage: `url(${event.cover})` } : undefined} />
        {!event.cover && <div className="ghost">{gen.key}</div>}
        <div className="scrim" />
        <div className="acts">
          <button type="button" className={"iconbtn" + (fav ? " on" : "")} aria-label="Favoritar" onClick={() => setFav((v) => !v)}>{fav ? "♥" : "♡"}</button>
        </div>
        <div className="wrap inner">
          <div className="tags">
            <span className="tag solid">{event.catLabel}</span>
            {event.subcategoria && <span className="tag">{event.subcategoria}</span>}
            {tiers.some((t) => t.isHalf) && <span className="tag">Meia-entrada</span>}
          </div>
          <h1>{event.title}</h1>
          <div className="meta">
            <div className="mi"><b>{event.dateFull}</b><span>{event.time}{event.endsAtISO ? " · até o fim da noite" : ""}</span></div>
            <div className="mi"><b>{event.venueCity}</b><span>{event.endereco?.cidade ?? ""}</span></div>
          </div>
        </div>
      </header>

      <main className="wrap">
        <div className="body">
          <div className="main">
            <div className="sec-block">
              <h2>Sobre o evento</h2>
              {event.desc ? (
                <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeRichText(event.desc) }} />
              ) : (
                <p className="prose">Detalhes do evento em breve.</p>
              )}
              <p className="disc">Abertura dos portões uma hora antes. Evento sujeito à classificação indicativa. Ingressos não reembolsáveis após a confirmação, conforme a política de compras.</p>
            </div>

            <div className="sec-block">
              <h2>Local</h2>
              <div className="mapc">
                {event.showOnMaps !== false ? (
                  <iframe
                    className="map"
                    title={`Mapa — ${event.venueCity}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(buscaMapa)}&z=15&output=embed`}
                  />
                ) : (
                  <div className="map"><span className="pin" /></div>
                )}
                <div className="minfo">
                  <div><b>{event.venueCity}</b>{enderecoLinha && <><br /><span>{enderecoLinha}</span></>}</div>
                  {event.showOnMaps !== false && (
                    <a className="btn btn-ghost" target="_blank" rel="noopener noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buscaMapa)}`}>Como chegar</a>
                  )}
                </div>
              </div>
            </div>

          </div>

          <aside className="buy" id="buy">{buyInner}</aside>
        </div>

        {relacionados.length > 0 && (
          <>
            <div className="divider" />
            <section className="rel">
              <h2>Você também vai curtir</h2>
              <div className="rel-grid">
                {relacionados.map((e) => {
                  const g = genreOf(e.catLabel);
                  return (
                    <Link className="rc" key={e.id} href={`/evento/${e.id}`}>
                      <div className={"ra " + (e.cover ? "" : g.cls)} style={e.cover ? { backgroundImage: `url(${e.cover})` } : undefined}>
                        <div className="rs" /><div className="rt">{e.title}</div>
                      </div>
                      <div className="rf"><span className="rw">{e.d} {e.mon} · {event.endereco?.cidade ?? e.venueCity.split("·").pop()?.trim()}</span></div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand"><LogoElleva /></div>
            <div className="foot-col"><h5>Elleva</h5><Link prefetch={false} href="/agenda">Agenda</Link><Link prefetch={false} href="/produtores">Produtores</Link><Link prefetch={false} href="/ajuda">Central de ajuda</Link></div>
            <div className="foot-col"><h5>Legal</h5><Link prefetch={false} href="/terms">Política de compras</Link><Link prefetch={false} href="/privacy">Privacidade</Link></div>
            <div className="foot-col"><h5>Contato</h5><a href="mailto:contato@ellevaeventos.com.br">contato@ellevaeventos.com.br</a></div>
          </div>
          <div className="foot-base">© 2026 Elleva Tickets</div>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={proceed} />}
    </div>
  );
}
