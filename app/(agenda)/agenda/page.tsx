import type { Metadata } from "next";
import { AgendaGrade } from "@/components/elleva/agenda-grade";
import { getEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Agenda de eventos no interior de SP e sul de MG | Elleva Tickets",
  description:
    "Tudo que está em cartaz em Mogi Guaçu, Mogi Mirim, Itapira, Americana e região. Shows, festas, teatro e esporte.",
};
export const revalidate = 300;

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [events, { q }] = await Promise.all([getEvents(), searchParams]);
  const query = q?.trim() ?? "";
  const filtrados = query
    ? events.filter((e) => `${e.title} ${e.venueCity} ${e.catLabel}`.toLowerCase().includes(query.toLowerCase()))
    : events;
  return <AgendaGrade events={filtrados} destaqueHeader="no interior" query={query || undefined} />;
}
