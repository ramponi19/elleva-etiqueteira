"use client";

import { useState } from "react";
import EventCard from "@/components/marketing/event-card";
import type { EventItem } from "@/lib/events";

const PAGE_SIZE = 12;

export default function EventGrid({ events }: { events: EventItem[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  return (
    <>
      <div className="ev-grid">
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
