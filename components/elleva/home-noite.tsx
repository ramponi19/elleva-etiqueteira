"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LogoElleva } from "@/components/elleva/logo";
import { EntrarModal } from "@/components/elleva/entrar-modal";
import { useRouter } from "next/navigation";
import type { EventItem } from "@/lib/events";

type Cat = { key: string; cls: string };
function catOf(label: string): Cat {
  const l = (label || "").toLowerCase();
  if (/festa|balada/.test(l)) return { key: "Festa", cls: "g-festa" };
  if (/esporte/.test(l)) return { key: "Esporte", cls: "g-esporte" };
  if (/teatro|cultura|espet/.test(l)) return { key: "Teatro", cls: "g-teatro" };
  if (/corp|congresso|curso|palestra|summit/.test(l)) return { key: "Corporativo", cls: "g-corp" };
  return { key: "Show", cls: "g-show" };
}

const PILLS = [
  { cat: "tudo", label: "Tudo" },
  { cat: "Show", label: "Shows" },
  { cat: "Festa", label: "Festas" },
  { cat: "Teatro", label: "Teatro" },
  { cat: "Esporte", label: "Esporte" },
  { cat: "Corporativo", label: "Corporativo" },
];

export default function HomeNoite({
  events,
  loggedIn,
}: {
  events: EventItem[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [cat, setCat] = useState("tudo");
  const [q, setQ] = useState("");
  const reelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLCanvasElement>(null);

  const cards = useMemo(
    () => events.map((e) => ({ e, cat: catOf(e.catLabel) })),
    [events]
  );
  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return cards.filter(
      ({ e, cat: c }) =>
        (cat === "tudo" || c.key === cat) &&
        (query === "" || (e.title + " " + e.venueCity).toLowerCase().includes(query))
    );
  }, [cards, cat, q]);

  /* nav solidify + parallax do hero */
  useEffect(() => {
    const nav = document.getElementById("ehnav");
    const hero = document.querySelector<HTMLElement>(".ehome .hero .wrap");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onScroll = () => {
      if (nav) nav.classList.toggle("solid", scrollY > 40);
      if (hero && !reduce && scrollY < 900) {
        hero.style.transform = `translateY(${scrollY * 0.16}px)`;
        hero.style.opacity = String(Math.max(0, 1 - scrollY / 620));
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  /* reveal */
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".ehome .reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* reel cover-flow + setas + glare */
  useEffect(() => {
    const reel = reelRef.current;
    if (!reel) return;
    let raf = 0;
    const upd = () => {
      raf = 0;
      const mid = innerWidth / 2;
      reel.querySelectorAll<HTMLElement>(".slide").forEach((s) => {
        const inr = s.querySelector<HTMLElement>(".inr");
        if (!inr || s.style.display === "none") return;
        const r = inr.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const d = Math.max(-1, Math.min(1, (c - mid) / (innerWidth * 0.55)));
        const sc = 1 - Math.abs(d) * 0.26;
        inr.style.transform = `perspective(1400px) rotateY(${(-d * 20).toFixed(2)}deg) scale(${sc.toFixed(3)})`;
        inr.style.filter = `brightness(${(1 - Math.abs(d) * 0.35).toFixed(2)})`;
        s.style.opacity = (1 - Math.abs(d) * 0.5).toFixed(2);
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(upd); };
    reel.addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    const glare = (ev: PointerEvent) => {
      const t = (ev.target as HTMLElement).closest<HTMLElement>(".inr");
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", ((ev.clientX - r.left) / r.width) * 100 + "%");
      t.style.setProperty("--my", ((ev.clientY - r.top) / r.height) * 100 + "%");
    };
    reel.addEventListener("pointermove", glare);
    requestAnimationFrame(upd);
    (reel as unknown as { __upd?: () => void }).__upd = upd;
    return () => { reel.removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); reel.removeEventListener("pointermove", glare); };
  }, []);

  /* re-roda cover-flow quando o filtro muda */
  useEffect(() => {
    const reel = reelRef.current as (HTMLDivElement & { __upd?: () => void }) | null;
    if (reel) { reel.scrollLeft = 0; reel.__upd?.(); }
  }, [visible]);

  const step = () => {
    const s = reelRef.current?.querySelector<HTMLElement>(".slide");
    return s ? s.getBoundingClientRect().width + 26 : 380;
  };

  /* PALCO: refletores volumétricos */
  useEffect(() => {
    const c = stageRef.current;
    if (!c) return;
    const x = c.getContext("2d");
    if (!x) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, DPR = 1, scr = 0, alive = true;
    const rs = () => { DPR = Math.min(devicePixelRatio || 1, 1.25); W = c.width = innerWidth * DPR; H = c.height = innerHeight * DPR; c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px"; };
    rs();
    const onR = () => rs();
    const onS = () => { scr = Math.min(scrollY / innerHeight, 1.2); };
    addEventListener("resize", onR); addEventListener("scroll", onS, { passive: true });
    const beams = [
      { ox: 0.24, col: "255,90,31", sp: 0.00022, ph: 0, sway: 0.16, spread: 0.22 },
      { ox: 0.5, col: "255,159,90", sp: 0.00015, ph: 1.7, sway: 0.1, spread: 0.16 },
      { ox: 0.78, col: "156,75,255", sp: 0.00019, ph: 3.4, sway: 0.18, spread: 0.2 },
    ];
    const N = reduce ? 0 : 14; const emb: { x: number; y: number; s: number; v: number }[] = [];
    for (let i = 0; i < N; i++) emb.push({ x: Math.random(), y: Math.random(), s: Math.random() * 0.5 + 0.25, v: Math.random() * 0.00006 + 0.00002 });
    const glow = (px: number, py: number, r: number, col: string, a: number) => { const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); };
    const beam = (b: typeof beams[number], t: number) => {
      const ang = Math.sin(t * b.sp + b.ph) * b.sway;
      const ox = b.ox * W, oy = -0.12 * H, len = H * 1.5;
      const dx = Math.sin(ang), dy = Math.cos(ang);
      const px = -dy, py = dx, w0 = 16 * DPR, w1 = b.spread * W;
      const g = x.createLinearGradient(ox, oy, ox + dx * len, oy + dy * len);
      const cool = b.col.indexOf("156") === 0, m = Math.max(0, Math.min(1.1, scr));
      const a = (0.16 + Math.sin(t * 0.002 + b.ph) * 0.03) * (cool ? 1 + 0.85 * m : 1 - 0.45 * m);
      g.addColorStop(0, `rgba(${b.col},${a})`); g.addColorStop(1, `rgba(${b.col},0)`);
      x.fillStyle = g; x.beginPath();
      x.moveTo(ox + px * w0, oy + py * w0); x.lineTo(ox + dx * len + px * w1, oy + dy * len + py * w1);
      x.lineTo(ox + dx * len - px * w1, oy + dy * len - py * w1); x.lineTo(ox - px * w0, oy - py * w0); x.closePath(); x.fill();
    };
    const frame = (t: number) => {
      if (!alive) return;
      const base = x.createLinearGradient(0, 0, 0, H);
      base.addColorStop(0, "#160b0a"); base.addColorStop(0.55, "#08070A"); base.addColorStop(1, "#040305");
      x.fillStyle = base; x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = "lighter";
      for (const b of beams) beam(b, t);
      for (const e of emb) { e.y -= e.v; if (e.y < -0.05) { e.y = 1.05; e.x = Math.random(); } const ex = e.x * W + Math.sin(t * 0.0004 + e.y * 18) * 8 * DPR; glow(ex, e.y * H, e.s * 80 * DPR, "255,170,90", 0.05); }
      x.globalCompositeOperation = "source-over";
      if (!reduce) requestAnimationFrame(frame);
    };
    if (reduce) frame(0); else requestAnimationFrame(frame);
    return () => { alive = false; removeEventListener("resize", onR); removeEventListener("scroll", onS); };
  }, []);


  return (
    <div className="ehome">
      <div className="amb" aria-hidden />
      <canvas id="ehstage" ref={stageRef} aria-hidden />
      <div className="grain" aria-hidden />
      <div className="vig" aria-hidden />

      <nav className="top" id="ehnav">
        <div className="nav-in">
          <Link className="brand" href="/" aria-label="Elleva Tickets"><LogoElleva /></Link>
          <div className="nav-links">
            <Link href="/agenda">Agenda</Link>
            <Link href="/produtores">Produtores</Link>
            <a href="#como">Como funciona</a>
          </div>
          <div className="nav-right">
            {loggedIn ? <Link className="entrar" href="/conta">Minha conta</Link> : <EntrarModal className="entrar" />}
            <a className="mini" href="#cartaz">Ver eventos</a>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <div className="eyebrow">Elleva · Ingressos</div>
          <h1>
            <span className="ln"><span>Seu evento</span></span>
            <span className="ln"><span className="out">começa</span></span>
            <span className="ln"><span className="em">aqui.</span></span>
          </h1>
          <p className="lead">Shows, festas, teatro e eventos. Escolhe o lugar, como pagar, e o ingresso cai na hora — sem taxa escondida.</p>
          <div className="cta">
            <a className="btn btn-warm" href="#cartaz">Ver o que tá rolando →</a>
            <Link className="btn btn-ghost" href="/produtores">Sou produtor</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="sec" id="cartaz">
          <div className="wrap">
            <div className="sec-head reveal">
              <div><div className="eyebrow">Agenda</div><h2>Próximos<br />eventos</h2></div>
              <div className="side"><Link className="all" href="/agenda">Ver agenda completa →</Link></div>
            </div>
            <div className="filters reveal">
              <div className="fsearch"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar evento, artista ou cidade…" aria-label="Buscar evento" /></div>
              <div className="fpills">
                {PILLS.map((p) => (
                  <button type="button" key={p.cat} className={"fp" + (cat === p.cat ? " on" : "")} onClick={() => setCat(p.cat)}>{p.label}</button>
                ))}
              </div>
            </div>
            {visible.length === 0 && <p id="ehempty" style={{ display: "block" }}>Nenhum evento encontrado. Tenta outra busca ou categoria.</p>}
          </div>
          <div className="reel-wrap">
            <button type="button" className="reel-nav prev" aria-label="Anterior" onClick={() => reelRef.current?.scrollBy({ left: -step(), behavior: "smooth" })}>‹</button>
            <button type="button" className="reel-nav next" aria-label="Próximo" onClick={() => reelRef.current?.scrollBy({ left: step(), behavior: "smooth" })}>›</button>
            <div className="reel" ref={reelRef}>
              <div style={{ flex: "1 0 30px" }} />
              {cards.map(({ e, cat: c }) => {
                const show = visible.some((v) => v.e.id === e.id);
                const bgStyle = e.cover ? { backgroundImage: `url(${e.cover})` } : undefined;
                return (
                  <div className="slide" key={e.id} style={{ display: show ? undefined : "none" }}>
                    <div className="inr reveal" onClick={() => router.push(`/evento/${e.id}`)}>
                      <div className={"bg " + (e.cover ? "" : c.cls)} style={bgStyle}>{!e.cover && <span className="ghost">{c.key}</span>}</div>
                      <div className="streak" /><div className="scrim" /><div className="glare" />
                      <div className="pc">
                        <span className="ptag">{e.catLabel}</span>
                        <div>
                          <h3 className="pttl">{e.title}</h3>
                          <div className="pmeta">
                            <div><div className="pwhen">{e.dateFull} · {e.time}</div><div className="pvenue">{e.venueCity}</div></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ flex: "1 0 30px" }} />
            </div>
          </div>
        </section>

        <section className="sec wrap" id="como" style={{ padding: "60px 0" }}>
          <div className="sec-head reveal" style={{ marginBottom: 30 }}>
            <div><div className="eyebrow">Como funciona</div><h2 style={{ fontSize: "clamp(28px,4vw,52px)" }}>Do palco pra sua mão</h2></div>
          </div>
          <div className="why-grid reveal">
            <div className="why-cell"><div className="n">01</div><h4>Escolhe o lugar</h4><p>Pista, camarote ou o assento no mapa. O preço já aparece com a taxa somada — nada de surpresa no fim.</p></div>
            <div className="why-cell"><div className="n">02</div><h4>Paga no Pix, na hora</h4><p>Ou cartão em até 12x. A confirmação é imediata — nada de ficar horas “aguardando”.</p></div>
            <div className="why-cell"><div className="n">03</div><h4>Entra com o QR</h4><p>O ingresso cai no seu WhatsApp e fica salvo na conta. Na portaria, é só apresentar.</p></div>
          </div>

          <div className="prod reveal" id="produtores">
            <div className="eyebrow">Pra quem faz o evento</div>
            <h2>Seu evento merece casa cheia</h2>
            <p>Publica, vende no Pix e acompanha o público em tempo real. A divulgação regional é por nossa conta — você cuida da festa, a gente cuida da bilheteria.</p>
            <div className="pk">
              <div><b>10%</b><span>Taxa dita na cara, sem mensalidade</span></div>
              <div><b>D+2</b><span>Repasse com comprovante</span></div>
              <div><b>Ao vivo</b><span>Vendas e check-in em tempo real</span></div>
            </div>
            <Link className="btn btn-warm" href="/criar-evento">Publicar meu evento →</Link>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand"><LogoElleva /></div>
            <div className="foot-col"><h5>Elleva</h5><Link href="/agenda">Agenda</Link><Link href="/produtores">Produtores</Link><a href="#como">Como funciona</a><Link href="/ajuda">Central de ajuda</Link></div>
            <div className="foot-col"><h5>Legal</h5><Link href="/terms">Política de compras</Link><Link href="/privacy">Privacidade</Link></div>
            <div className="foot-col"><h5>Contato</h5><a href="mailto:contato@ellevaeventos.com.br">contato@ellevaeventos.com.br</a></div>
          </div>
          <div className="foot-base">© 2026 Elleva Tickets</div>
        </div>
      </footer>

    </div>
  );
}
