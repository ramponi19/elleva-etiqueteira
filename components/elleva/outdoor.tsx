"use client";

// ============================================================
// Outdoor da home (clara) — vitrine estilo Sympla (escolha do Lucas, 25/09)
// ============================================================
// Só imagens de eventos, sem painel nem fundo desfocado. A capa do evento atual
// (a mesma 1600×838 de sempre — o produtor não sobe arte extra) fica INTEIRA no
// centro da faixa de até 1920×535; nas laterais aparecem as capas do anterior e
// do próximo, menores e apagadas. Clicar numa lateral traz ela pro centro;
// clicar no centro abre o evento. Roda sozinho, em loop.
//
// Em vez de rolagem nativa, cada capa recebe uma posição --k (-2..2) em relação
// ao centro e o CSS desliza pelo transform. A chave de cada elemento é o índice
// "virtual" (pos + k, sem módulo): ao avançar, o React mantém os mesmos
// elementos e só o --k muda, então a troca anima; o que entra nasce em ±2, fora
// da tela. Com 2 eventos, as duas laterais mostram o outro evento.
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

const INTERVALO_MS = 5500;
const mod = (a: number, n: number) => ((a % n) + n) % n;

export function Outdoor({ slides }: { slides: SlideOutdoor[] }) {
  const [pos, setPos] = useState(0); // índice virtual (não volta a 0 no loop)
  const [pausado, setPausado] = useState(false);
  const arraste = useRef<{ x: number; y: number; moveu: boolean } | null>(null);
  const n = slides.length;
  const atual = n ? mod(pos, n) : 0;

  const andar = useCallback((d: number) => setPos((p) => p + d), []);

  // roda sozinho; para com o mouse em cima, com foco dentro, com a aba em
  // segundo plano e para quem pediu menos movimento no sistema
  useEffect(() => {
    if (n < 2 || pausado) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") andar(1);
    }, INTERVALO_MS);
    return () => clearInterval(t);
  }, [n, pausado, andar]);

  if (n === 0) return null;
  const legenda = slides[atual];
  // com 1 evento não há laterais (seria a mesma capa repetida)
  const posicoes = n === 1 ? [0] : [-2, -1, 0, 1, 2];

  // arraste (dedo ou mouse): passou de 40px na horizontal, troca
  const onPointerDown = (e: React.PointerEvent) => { arraste.current = { x: e.clientX, y: e.clientY, moveu: false }; };
  const onPointerUp = (e: React.PointerEvent) => {
    const a = arraste.current;
    if (!a) return;
    const dx = e.clientX - a.x, dy = e.clientY - a.y;
    if (n > 1 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { a.moveu = true; andar(dx < 0 ? 1 : -1); }
  };

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
      <div className="faixa" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {posicoes.map((k) => {
          const vi = pos + k;
          const s = slides[mod(vi, n)];
          const centro = k === 0;
          return (
            <Link
              key={vi}
              href={`/evento/${s.id}`}
              className={"slide" + (centro ? " centro" : "")}
              style={{ "--k": k } as React.CSSProperties}
              draggable={false}
              tabIndex={centro ? undefined : -1}
              aria-hidden={centro ? undefined : true}
              aria-label={centro ? `${s.title} — ${s.quando}, ${s.local} (${atual + 1} de ${n})` : undefined}
              onClick={(e) => {
                // arrastou: não é clique. Lateral: traz pro centro em vez de abrir.
                if (arraste.current?.moveu) { e.preventDefault(); arraste.current = null; return; }
                if (!centro) { e.preventDefault(); andar(k); }
              }}
            >
              {s.cover ? (
                <Image
                  src={s.cover}
                  alt=""
                  fill
                  draggable={false}
                  sizes="(max-width: 760px) 100vw, 1022px"
                  loading={centro && pos === 0 ? "eager" : "lazy"}
                  fetchPriority={centro && pos === 0 ? "high" : "auto"}
                />
              ) : (
                <span className={"arte-gerada " + s.fundo}>
                  <span className="ag-cat">{s.catLabel}</span>
                  <span className="ag-titulo">{s.title}</span>
                  <span className="ag-quando">{s.quando} · {s.cidade}</span>
                </span>
              )}
            </Link>
          );
        })}
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
                onClick={() => {
                  // caminho mais curto até o evento i, nos dois sentidos do loop
                  let d = mod(i - atual, n);
                  if (d > n / 2) d -= n;
                  andar(d);
                }}
              />
            ))}
            <button type="button" className="seta ant" aria-label="Destaque anterior" onClick={() => andar(-1)}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="m15 6-6 6 6 6" /></svg>
            </button>
            <button type="button" className="seta prox" aria-label="Próximo destaque" onClick={() => andar(1)}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
