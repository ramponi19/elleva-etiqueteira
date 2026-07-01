"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import EventCard from "@/components/marketing/event-card";
import type { EventItem } from "@/lib/events";

const PAGE_SIZE = 12;

export default function EventGrid({ events }: { events: EventItem[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const gridRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);
  const triggers = useRef<ScrollTrigger[]>([]);

  // Revela os cards com stagger. Os que ainda não entraram na tela ficam
  // escondidos pelo CSS (.has-motion .ev-grid > *). "Carregar mais" adiciona
  // novos cards, que também começam escondidos e são revelados na hora.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const grid = gridRef.current;
    if (!grid) return;
    gsap.registerPlugin(ScrollTrigger);

    const fresh = (Array.from(grid.children) as HTMLElement[]).filter((c) => !c.dataset.revealed);
    fresh.forEach((c) => (c.dataset.revealed = "1"));
    if (fresh.length === 0) return;

    // esconde via JS (sem CSS/flash de hidratação); os cards estão abaixo da dobra
    gsap.set(fresh, { opacity: 0, y: 24 });

    if (firstRun.current) {
      firstRun.current = false;
      const created = ScrollTrigger.batch(fresh, {
        start: "top 90%",
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.07,
            overwrite: true,
          }),
      });
      triggers.current.push(...created);
    } else {
      gsap.to(fresh, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.05,
        overwrite: true,
      });
    }
  }, [visible]);

  useEffect(() => () => {
    triggers.current.forEach((t) => t.kill());
    triggers.current = [];
  }, []);

  return (
    <>
      <div className="ev-grid" ref={gridRef}>
        {events.slice(0, visible).map((ev) => (
          <EventCard key={ev.id} event={ev} />
        ))}
      </div>
      {visible < events.length && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <button type="button" className="btn btn-ghost btn-lg" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Carregar mais eventos
          </button>
        </div>
      )}
    </>
  );
}
