import type { Metadata } from "next";
import AgendaContent from "@/components/marketing/agenda-content";
import { getEvents } from "@/lib/events";

export const metadata: Metadata = { title: "Agenda" };
export const revalidate = 300;

export default async function AgendaPage() {
  const events = await getEvents();

  return (
    <div className="container" style={{ padding: "48px 48px 64px" }}>
      <span className="eyebrow eyebrow-gold">Agenda completa</span>
      <h1 className="h1" style={{ fontSize: 48, marginTop: 18 }}>
        Todos os <span className="serif accent-gold">eventos</span>
      </h1>

      <AgendaContent events={events} />
    </div>
  );
}
