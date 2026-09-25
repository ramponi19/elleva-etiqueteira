"use client";

// ============================================================
// Outdoor da home (clara) — banner na largura da página, logo abaixo do cabeçalho,
// no molde da Seo Ingresso: um banner por evento, clicável, que leva à página
// do evento e roda sozinho para o lado.
// ============================================================
// Capa recomendada no cadastro: 1600×838 (~1,91:1). A faixa do computador é
// mais larga que isso, então a arte fica INTEIRA no centro (sem cortar o texto
// que o produtor põe na arte) e as laterais recebem a mesma imagem desfocada.
// No celular a faixa já tem a proporção da capa e a arte ocupa tudo.
// (Começou de ponta a ponta como na Seo Ingresso; o Lucas preferiu dentro
// dos limites da página, alinhado com o logo e a grade.)
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type SlideOutdoor = {
  id: string;
  title: string;
  cover: string | null;
  catLabel: string;
  quando: string;
  cidade: string;
  /** classe do fundo gerado por categoria (evento sem capa) */
  fundo: string;
};

const INTERVALO_MS = 5500;

export function Outdoor({ slides }: { slides: SlideOutdoor[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const n = slides.length;

  const irPara = useCallback((i: number) => {
    const el = trilho.current;
    if (!el || n === 0) return;
    const alvo = ((i % n) + n) % n;
    el.scrollTo({ left: alvo * el.clientWidth, behavior: "smooth" });
  }, [n]);

  // índice atual acompanha o arraste (swipe no celular, trackpad no computador)
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setAtual(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // roda sozinho; para com o mouse em cima, com foco dentro, com a aba em
  // segundo plano e para quem pediu menos movimento no sistema
  useEffect(() => {
    if (n < 2 || pausado) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") irPara(atual + 1);
    }, INTERVALO_MS);
    return () => clearInterval(t);
  }, [n, pausado, atual, irPara]);

  if (n === 0) return null;
  const legenda = slides[Math.min(atual, n - 1)];

  return (
    <section
      className="outdoor"
      aria-roledescription="carrossel"
      aria-label="Eventos em destaque"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPausado(false); }}
    >
      <div className="faixa">
        <div className="trilho" ref={trilho}>
          {slides.map((s, i) => (
            <Link
              key={s.id}
              href={`/evento/${s.id}`}
              className="slide"
              aria-roledescription="slide"
              aria-label={`${s.title} — ${s.quando}, ${s.cidade} (${i + 1} de ${n})`}
            >
              {s.cover ? (
                <>
                  <span className="fundo-desfocado" aria-hidden>
                    <Image src={s.cover} alt="" fill sizes="96px" />
                  </span>
                  <span className="arte">
                    <Image
                      src={s.cover}
                      alt=""
                      fill
                      sizes="(max-width: 840px) 100vw, 840px"
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                    />
                  </span>
                </>
              ) : (
                <span className={"arte arte-gerada " + s.fundo}>
                  <span className="ag-cat">{s.catLabel}</span>
                  <span className="ag-titulo">{s.title}</span>
                  <span className="ag-quando">{s.quando} · {s.cidade}</span>
                </span>
              )}
            </Link>
          ))}
        </div>

        {n > 1 && (
          <>
            <button type="button" className="seta ant" aria-label="Destaque anterior" onClick={() => irPara(atual - 1)}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="m15 6-6 6 6 6" /></svg>
            </button>
            <button type="button" className="seta prox" aria-label="Próximo destaque" onClick={() => irPara(atual + 1)}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
            </button>
          </>
        )}
      </div>

      <div className="rodape-outdoor">
        <p className="legenda" aria-live="polite">
          <strong>{legenda.title}</strong>
          <span>{legenda.quando} · {legenda.cidade}</span>
        </p>
        {n > 1 && (
          <div className="pontos">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={i === atual ? "on" : undefined}
                aria-label={`Mostrar ${s.title}`}
                aria-current={i === atual ? "true" : undefined}
                onClick={() => irPara(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
