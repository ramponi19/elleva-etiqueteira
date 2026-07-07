"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "@studio-freight/lenis";
import type { gsap as GsapType } from "gsap";
import type { SplitText as SplitTextType } from "gsap/SplitText";

// Movimento para as páginas de marketing:
// - Lenis: scroll suave global (o "peso" dos sites premium)
// - ScrollTrigger reveals: [data-reveal] (sobe + aparece), [data-reveal-lines]
//   (reveal por linha), [data-parallax] (parallax sutil no scroll)
// Respeita prefers-reduced-motion e não depende de JS pro conteúdo existir.
// GSAP/Lenis entram por import() dinâmico: ficam fora do bundle crítico
// (hidratação/TBT) e nem são baixados com prefers-reduced-motion.
const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Libs = {
  gsap: typeof GsapType;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
  SplitText: typeof SplitTextType;
  Lenis: typeof Lenis;
};

let libsPromise: Promise<Libs> | null = null;
function loadLibs(): Promise<Libs> {
  if (!libsPromise) {
    libsPromise = Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("gsap/SplitText"),
      import("@studio-freight/lenis"),
    ]).then(([g, st, sp, l]) => {
      g.gsap.registerPlugin(st.ScrollTrigger, sp.SplitText);
      return {
        gsap: g.gsap,
        ScrollTrigger: st.ScrollTrigger,
        SplitText: sp.SplitText,
        Lenis: l.default,
      };
    });
  }
  return libsPromise;
}

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // Lenis + ticker do GSAP — monta uma vez
  useEffect(() => {
    if (prefersReduced()) return;
    let alive = true;
    let cleanup: (() => void) | undefined;

    loadLibs().then(({ gsap, ScrollTrigger, Lenis }) => {
      if (!alive) return;
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);

      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(raf);
        lenis.destroy();
        lenisRef.current = null;
      };
    });

    return () => {
      alive = false;
      cleanup?.();
    };
  }, []);

  // Reveals + parallax — re-escaneia a cada troca de rota (o layout não remonta)
  useEffect(() => {
    if (prefersReduced()) return;
    lenisRef.current?.scrollTo(0, { immediate: true });

    let cancelled = false;
    let ctx: ReturnType<typeof GsapType.context> | undefined;
    const splits: SplitTextType[] = [];

    loadLibs().then(({ gsap, ScrollTrigger, SplitText }) => {
      if (cancelled) return;

      ctx = gsap.context(() => {
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
      });

      // reveal por linha depende das fontes já carregadas para quebrar certo
      document.fonts.ready.then(() => {
        if (cancelled || !ctx) return;
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

          // hero: revela por linha logo no load (começa com opacity:0 inline)
          gsap.utils.toArray<HTMLElement>("[data-hero-title]").forEach((el) => {
            const split = new SplitText(el, { type: "lines" });
            splits.push(split);
            gsap.set(el, { opacity: 1 });
            gsap.from(split.lines, {
              yPercent: 100,
              opacity: 0,
              duration: 1,
              ease: "power4.out",
              stagger: 0.14,
              delay: 0.1,
            });
          });
        });
        ScrollTrigger.refresh();
      });

      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      splits.forEach((s) => s.revert());
      ctx?.revert();
    };
  }, [pathname]);

  return <>{children}</>;
}
