// Cidades atendidas (spec 8.2) — rotas estáticas /agenda/[cidade] pra SEO local.
import type { EventItem } from "@/lib/events";

export interface Cidade {
  slug: string;
  nome: string;
}

export const CIDADES: Cidade[] = [
  { slug: "mogi-guacu", nome: "Mogi Guaçu" },
  { slug: "mogi-mirim", nome: "Mogi Mirim" },
  { slug: "itapira", nome: "Itapira" },
  { slug: "americana", nome: "Americana" },
  { slug: "sul-de-mg", nome: "Sul de MG" },
];

export function cidadePorSlug(slug: string): Cidade | undefined {
  return CIDADES.find((c) => c.slug === slug);
}

/** cidade do evento = último trecho de "Venue · Cidade" */
export function cidadeDoEvento(e: EventItem): string {
  return e.venueCity.split("·").pop()?.trim() ?? "";
}

export function eventosDaCidade(events: EventItem[], cidade: Cidade): EventItem[] {
  return events.filter(
    (e) => cidadeDoEvento(e).toLowerCase() === cidade.nome.toLowerCase()
  );
}
