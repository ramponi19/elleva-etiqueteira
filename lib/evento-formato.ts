// ============================================================
// Textos de evento no visual claro (home, página do evento)
// ============================================================
// Padrão pedido pelo Lucas (28/09): "Mogi Guaçu - SP", "Teatro, Mogi Guaçu - SP"
// e "Sábado, 21 de Nov às 21:00". Funções puras: servem em servidor e cliente.
import type { EventItem } from "@/lib/events";

/** "Mogi Guaçu - SP" (sem estado cadastrado: só a cidade) */
export function cidadeUF(e: EventItem) {
  const partes = e.venueCity.split(" · ");
  const cidade = e.endereco?.cidade || partes[partes.length - 1] || e.venueCity;
  const uf = e.endereco?.uf?.trim().toUpperCase();
  return uf ? `${cidade} - ${uf}` : cidade;
}

/** "Teatro Municipal, Mogi Guaçu - SP" */
export function localCompleto(e: EventItem) {
  const local = e.venueCity.split(" · ")[0];
  return local ? `${local}, ${cidadeUF(e)}` : cidadeUF(e);
}

// sempre no horário de Brasília (o servidor roda em UTC)
const FMT_DIA = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "short" });
const FMT_HORA = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** "Sábado, 21 de Nov às 21:00" */
export function dataExtensa(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(FMT_DIA.formatToParts(d).map((x) => [x.type, x.value]));
  const mes = maiuscula(String(p.month ?? "").replace(".", ""));
  return `${maiuscula(String(p.weekday ?? ""))}, ${p.day} de ${mes} às ${FMT_HORA.format(d)}`;
}

/** classe do fundo gerado por categoria (evento sem capa) */
export const FUNDO: Record<string, string> = {
  SHOW: "g-show", FESTA: "g-festa", ESPORTE: "g-esporte", TEATRO: "g-teatro", CORPORATIVO: "g-corp", CURSO: "g-corp",
};
export const ROTULO: Record<string, string> = {
  SHOW: "Show", FESTA: "Festa", ESPORTE: "Esporte", TEATRO: "Teatro", CORPORATIVO: "Corporativo", CURSO: "Curso",
};
