"use client";

// ============================================================
// Outdoor da home (clara) — faixa de até 1920×535 colada no cabeçalho, no
// molde da Seo Ingresso: um banner por evento, clicável, que leva à página do
// evento e roda sozinho para o lado.
// ============================================================
// O produtor NÃO sobe arte especial para o outdoor: usa a capa de sempre
// (1600×838, ~1,91:1). Esticar essa capa até 3,59:1 cortaria quase metade da
// altura (data e local da arte somem), então o outdoor se monta sozinho:
//   - computador: a capa INTEIRA à direita, na altura toda; à esquerda, um
//     painel com nome, data, local e "Comprar ingresso", pintado com a cor da
//     borda esquerda da própria capa (lida no navegador), que emenda na arte;
//     a cor do texto (branco/escuro) sai do contraste com essa cor.
//   - celular: a faixa tem a proporção da capa e a arte ocupa tudo.
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
  /** "Local · Cidade" */
  local: string;
  /** classe do fundo gerado por categoria (evento sem capa) */
  fundo: string;
};

type Cor = { fundo: string; texto: "claro" | "escuro" };

const INTERVALO_MS = 5500;
const COR_PADRAO: Cor = { fundo: "rgb(27, 21, 18)", texto: "claro" };

// luminância relativa (WCAG) de um canal 0–255
const canal = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminancia = (r: number, g: number, b: number) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);

/** Cor média da borda esquerda da capa. Usa a versão de 64px do otimizador do
 *  Next (mesma origem: o canvas pode ler os pixels sem CORS). */
function lerCorDaBorda(cover: string): Promise<Cor> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        const w = 64, h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * 64));
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const ctx = cv.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(COR_PADRAO);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, 3, h); // 3 colunas da borda
        let r = 0, g = 0, b = 0;
        const px = data.length / 4;
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
        r = Math.round(r / px); g = Math.round(g / px); b = Math.round(b / px);
        const L = luminancia(r, g, b);
        // texto branco ou quase preto (#17110D, L≈0,006): o que der mais contraste
        const cBranco = 1.05 / (L + 0.05), cEscuro = (L + 0.05) / 0.056;
        resolve({ fundo: `rgb(${r}, ${g}, ${b})`, texto: cBranco >= cEscuro ? "claro" : "escuro" });
      } catch {
        resolve(COR_PADRAO);
      }
    };
    img.onerror = () => resolve(COR_PADRAO);
    img.src = `/_next/image?url=${encodeURIComponent(cover)}&w=64&q=75`;
  });
}

export function Outdoor({ slides }: { slides: SlideOutdoor[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [cores, setCores] = useState<Record<string, Cor>>({});
  const n = slides.length;

  const irPara = useCallback((i: number) => {
    const el = trilho.current;
    if (!el || n === 0) return;
    const alvo = ((i % n) + n) % n;
    el.scrollTo({ left: alvo * el.clientWidth, behavior: "smooth" });
  }, [n]);

  // cor de cada capa (uma vez por capa)
  useEffect(() => {
    let vivo = true;
    slides.forEach((s) => {
      if (!s.cover) return;
      lerCorDaBorda(s.cover).then((c) => { if (vivo) setCores((atual) => ({ ...atual, [s.id]: c })); });
    });
    return () => { vivo = false; };
  }, [slides]);

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
          {slides.map((s, i) => {
            const cor = cores[s.id] ?? COR_PADRAO;
            return (
              <Link
                key={s.id}
                href={`/evento/${s.id}`}
                className={"slide" + (s.cover ? " com-capa" : "")}
                aria-roledescription="slide"
                aria-label={`${s.title} — ${s.quando}, ${s.local} (${i + 1} de ${n})`}
                style={s.cover ? ({ "--cor": cor.fundo } as React.CSSProperties) : undefined}
              >
                {s.cover ? (
                  <>
                    <span className={"painel " + (cor.texto === "claro" ? "txt-claro" : "txt-escuro")} aria-hidden>
                      <span className="p-cat">{s.catLabel}</span>
                      <span className="p-titulo">{s.title}</span>
                      <span className="p-info">{s.quando}</span>
                      <span className="p-info">{s.local}</span>
                      <span className="p-btn">Comprar ingresso</span>
                    </span>
                    <span className="arte">
                      <Image
                        src={s.cover}
                        alt=""
                        fill
                        sizes="(max-width: 760px) 100vw, 1022px"
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
            );
          })}
        </div>

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
            <button type="button" className="seta ant" aria-label="Destaque anterior" onClick={() => irPara(atual - 1)}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="m15 6-6 6 6 6" /></svg>
            </button>
            <button type="button" className="seta prox" aria-label="Próximo destaque" onClick={() => irPara(atual + 1)}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
