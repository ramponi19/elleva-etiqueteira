import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgendaGrade } from "@/components/elleva/agenda-grade";
import { CIDADES, cidadePorSlug, eventosDaCidade } from "@/lib/cidades";
import { getEvents } from "@/lib/events";

export const revalidate = 300;

export function generateStaticParams() {
  return CIDADES.map((c) => ({ cidade: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ cidade: string }> }): Promise<Metadata> {
  const { cidade } = await params;
  const c = cidadePorSlug(cidade);
  if (!c) return { title: "Agenda" };
  return {
    title: `Agenda de eventos em ${c.nome} | Elleva Tickets`,
    description: `O que está em cartaz em ${c.nome}: shows, festas, teatro e esporte com ingresso na Elleva.`,
  };
}

export default async function AgendaCidadePage({ params }: { params: Promise<{ cidade: string }> }) {
  const { cidade } = await params;
  const c = cidadePorSlug(cidade);
  if (!c) notFound();
  const events = await getEvents();
  return <AgendaGrade events={eventosDaCidade(events, c)} destaqueHeader={`em ${c.nome}`} cidadeAtiva={c.slug} />;
}
