"use client";

// ============================================================
// Página do evento — visual claro (28/09, pedido do Lucas)
// ============================================================
// Mesmo cabeçalho e rodapé da home. O topo com a capa esmaecida ao fundo
// ficou como era no escuro ("gosto desse outdoor esmaecido como é hoje");
// o resto segue a Sympla: fundo branco, descrição e local à esquerda, caixa de
// ingressos fixa à direita (no celular ela vem logo abaixo do topo).
// A lógica de compra é a mesma do evento-noite.tsx (a versão escura, mantida
// para voltar): lotes, quantidades, taxa, parcelas, login antes do checkout.
import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CabecalhoClaro } from "@/components/elleva/clara/cabecalho";
import { RodapeClaro } from "@/components/elleva/clara/rodape";
import { CardEvento } from "@/components/elleva/clara/card-evento";
import type { ContaResumo } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { feeUnit, round2 } from "@/lib/fees";
import { sanitizeRichText } from "@/lib/sanitize";
import type { EventItem, Tier } from "@/lib/events";
import { FUNDO, dataExtensa, localCompleto } from "@/lib/evento-formato";

const AuthModal = dynamic(() => import("@/components/marketing/auth-modal"), { ssr: false });

const fmt2 = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function EventoClaro({
  event,
  tiers,
  conta,
  relacionados,
  saleClosed,
}: {
  event: EventItem;
  tiers: Tier[];
  conta: ContaResumo | null;
  relacionados: EventItem[];
  saleClosed: boolean;
}) {
  const router = useRouter();
  const loggedIn = !!conta;
  const { addItems } = useCart();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [showAuth, setShowAuth] = useState(false);
  const [fav, setFav] = useState(false);

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
  const fundoCategoria = FUNDO[event.catLabel] ?? "g-show";

  const linhaLote = (t: Tier) => {
    const esgotado = t.available != null && t.available <= 0;
    const poucos = t.available != null && t.available > 0 && t.available <= 10;
    const noMax = t.available != null && (qty[t.id] || 0) >= t.available;
    return (
      <div className={"lote" + (esgotado ? " off" : "")} key={t.id}>
        <div className="lote-info">
          <div className="lote-nome">
            {t.name}
            {t.isHalf && <span className="selo">Meia</span>}
            {esgotado && <span className="selo">Esgotado</span>}
            {!esgotado && poucos && <span className="selo quente">Últimas</span>}
          </div>
          <div className="lote-preco">{fmt2(t.price)}{!absorve && <span> + taxa</span>}</div>
          {t.desc && <div className="lote-desc">{t.desc}</div>}
        </div>
        {!esgotado && (
          <div className="passo">
            <button type="button" aria-label={`Tirar ${t.name}`} disabled={(qty[t.id] || 0) === 0} onClick={() => dec(t.id)}>−</button>
            <span className="q" aria-live="polite">{qty[t.id] || 0}</span>
            <button type="button" aria-label={`Adicionar ${t.name}`} disabled={noMax} onClick={() => inc(t)}>+</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="eclara evc">
      <CabecalhoClaro conta={conta} />

      <header className="evc-capa">
        <div className={"arte " + (event.cover ? "" : fundoCategoria)} style={event.cover ? { backgroundImage: `url(${event.cover})` } : undefined} />
        <div className="veu" />
        <div className="wrap evc-capa-in">
          <h1>{event.title}</h1>
          <ul className="evc-meta">
            <li>
              <svg viewBox="0 0 24 24" aria-hidden><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
              {dataExtensa(event.startsAtISO)}
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
              {localCompleto(event)}
            </li>
          </ul>
          <button type="button" className={"favoritar" + (fav ? " on" : "")} aria-pressed={fav} aria-label="Favoritar" onClick={() => setFav((v) => !v)}>
            <svg viewBox="0 0 24 24" aria-hidden><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
          </button>
        </div>
      </header>

      <main className="wrap">
        <div className="evc-corpo">
          <div className="evc-info">
            <section className="evc-sec" aria-labelledby="t-sobre">
              <h2 id="t-sobre">Sobre o evento</h2>
              {event.desc ? (
                <div className="prosa" dangerouslySetInnerHTML={{ __html: sanitizeRichText(event.desc) }} />
              ) : (
                <p className="prosa">Detalhes do evento em breve.</p>
              )}
              <p className="aviso">Abertura dos portões uma hora antes. Evento sujeito à classificação indicativa. Ingressos não reembolsáveis após a confirmação, conforme a política de compras.</p>
            </section>

            <section className="evc-sec" aria-labelledby="t-local">
              <h2 id="t-local">Local</h2>
              <div className="mapa-card">
                {event.showOnMaps !== false && (
                  <iframe
                    className="mapa"
                    title={`Mapa — ${event.venueCity}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(buscaMapa)}&z=15&output=embed`}
                  />
                )}
                <div className="mapa-info">
                  <div>
                    <b>{localCompleto(event)}</b>
                    {enderecoLinha && <span>{enderecoLinha}</span>}
                  </div>
                  {event.showOnMaps !== false && (
                    <a className="btn-contorno" target="_blank" rel="noopener noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buscaMapa)}`}>Como chegar</a>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="evc-compra" id="ingressos" aria-labelledby="t-ingressos">
            <h2 id="t-ingressos">Ingressos</h2>
            {saleClosed ? (
              <div className="encerrado"><b>Vendas encerradas</b><span>Este evento já aconteceu.</span></div>
            ) : (
              <>
                <div className="lotes">
                  {ingressos.map(linhaLote)}
                  {adicionais.map(linhaLote)}
                </div>
                <div className="resumo">
                  <div className="linha"><span>Subtotal</span><span>{fmt2(subtotal)}</span></div>
                  <div className="linha"><span>Taxa</span><span>{absorve ? "inclusa" : fmt2(taxa)}</span></div>
                  <div className="total"><span>Total</span><span>{fmt2(total)}</span></div>
                  {total > 0 && maxParcelas > 1 && <div className="parcelas">ou em até {maxParcelas}x no cartão</div>}
                </div>
                <button type="button" className="btn btn-cheio" disabled={count === 0} onClick={prosseguir}>
                  {count === 0 ? "Selecione um ingresso" : "Garantir ingresso"}
                </button>
              </>
            )}
          </aside>
        </div>

        {relacionados.length > 0 && (
          <section className="bloco divisa" aria-labelledby="t-outros">
            <div className="bloco-cab">
              <h2 id="t-outros">Outros eventos</h2>
            </div>
            <div className="grade">
              {relacionados.map((e) => <CardEvento key={e.id} e={e} />)}
            </div>
          </section>
        )}
      </main>

      <RodapeClaro />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={proceed} />}
    </div>
  );
}
