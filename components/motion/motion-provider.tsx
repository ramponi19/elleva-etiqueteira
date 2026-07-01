"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "@studio-freight/lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Movimento para as páginas de marketing:
// - Lenis: scroll suave global (o "peso" dos sites premium)
// - ScrollTrigger reveals: [data-reveal] (sobe + aparece) e [data-reveal-lines]
//   (reveal por linha de texto), [data-parallax] (parallax sutil no scroll)
// Respeita prefers-reduced-motion e não depende de JS para o conteúdo existir
// (o estado inicial escondido vem do próprio gsap, no cliente).
const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // Lenis + ticker do GSAP — monta uma vez
  useEffect(() => {
    if (prefersReduced()) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Reveals + parallax — re-escaneia a cada troca de rota (o layout não remonta)
  useEffect(() => {
    if (prefersReduced()) return;
    lenisRef.current?.scrollTo(0, { immediate: true });

    let cancelled = false;
    const splits: SplitText[] = [];

    const ctx = gsap.context(() => {
      // reveal simples (sobe + fade)
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }
        );
      });

      // parallax sutil (scrub) — px de deslocamento vem de data-parallax
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const s = parseFloat(el.dataset.parallax || "40");
        const scope = (el.closest("[data-parallax-scope]") as HTMLElement) || el;
        gsap.fromTo(
          el,
          { y: s },
          {
            y: -s,
            ease: "none",
            scrollTrigger: { trigger: scope, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });

      // carrossel: recua/desliza levemente ao rolar para fora (profundidade)
      const hero = document.querySelector<HTMLElement>(".carousel-section");
      if (hero) {
        gsap.to(hero, {
          yPercent: -12,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
        });
      }
    });

    // reveal por linha depende das fontes já carregadas para quebrar certo
    document.fonts.ready.then(() => {
      if (cancelled) return;
      ctx.add(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal-lines]").forEach((el) => {
          const split = new SplitText(el, { type: "lines", autoSplit: true });
          splits.push(split);
          gsap.from(split.lines, {
            yPercent: 40,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          });
        });
      });
      ScrollTrigger.refresh();
    });

    ScrollTrigger.refresh();
    return () => {
      cancelled = true;
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, [pathname]);

  return <>{children}</>;
}
