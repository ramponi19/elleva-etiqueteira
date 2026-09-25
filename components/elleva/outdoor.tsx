"use client";

// ============================================================
// Outdoor da home (clara) — vitrine estilo Sympla (print do Lucas, 25/09)
// ============================================================
// Só imagens de eventos, sem painel nem fundo desfocado. A capa do evento atual
// (a mesma 1600×838 de sempre — o produtor não sobe arte extra) fica INTEIRA no
// centro; atrás dela, dos dois lados, as capas vizinhas empilhadas como
// cartões, cada nível menor e mais pra fora (só uma fatia aparece). Clicar num
// cartão lateral traz ele pro centro; clicar no centro abre o evento. Loop.
//
// Em vez de rolagem nativa, cada capa recebe uma posição --k (-N..N) em relação
// ao centro e o CSS desliza pelo transform. A chave de cada elemento é o índice
// "virtual" (pos + k, sem módulo): ao avançar, o React mantém os mesmos
// elementos e só o --k muda, então a troca anima; o que entra nasce invisível
// um nível além do último. Níveis por lado: até 3, sem repetir evento na pilha
// (com 2 eventos, 1 nível: os dois lados mostram o outro evento).
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
  const niveis = n <= 1 ? 0 : n === 2 ? 1 : Math.max(1, Math.min(3, Math.floor((n - 1) / 2)));
  const posicoes: number[] = [];
  for (let k = -(niveis + 1); k <= niveis + 1; k++) if (n > 1 || k === 0) posicoes.push(k);

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
          const a = Math.abs(k);
          const fora = a > niveis;
          return (
            <Link
              key={vi}
              href={`/evento/${s.id}`}
              className={"slide" + (centro ? " centro" : "") + (fora ? " fora" : "")}
              style={{ "--a": a, "--dir": Math.sign(k), zIndex: 10 - a } as React.CSSProperties}
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
        {n > 1 && (
          <>
            <button type="button" className="seta ant" aria-label="Destaque anterior" onClick={() => andar(-1)}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="m15 6-6 6 6 6" /></svg>
            </button>
            <button type="button" className="seta prox" aria-label="Próximo destaque" onClick={() => andar(1)}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
            </button>
          </>
        )}
      </div>

      <div className="rodape-outdoor">
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
          </div>
        )}
        <p className="legenda" aria-live="polite">
          <strong>{legenda.title}</strong>
          <span className="meta">
            <span><svg viewBox="0 0 24 24" aria-hidden><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>{legenda.local}</span>
            <span><svg viewBox="0 0 24 24" aria-hidden><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>{legenda.quando}</span>
          </span>
        </p>
      </div>
    </section>
  );
}
