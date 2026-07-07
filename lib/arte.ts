// Mapeamento categoria → cor de arte (spec §2). Client-safe: sem imports de
// servidor (o TicketCard/PosterFallback podem ser usados em Client Components).
import type { CategoryLabel } from "@/lib/events";

export type Tone = "sol" | "cartaz" | "palco" | "tinta" | "papel";

export interface Arte {
  tone: Tone;
  /** fundo do pôster/card quando não há foto */
  bg: string;
  /** cor do texto sobre a arte (display/números grandes) */
  fg: string;
  /** cor pra texto PEQUENO sobre a arte — §4: sobre sol, sempre tinta */
  fgPequeno: string;
  /** true quando a arte é clara e precisa de badge tinta */
  clara: boolean;
  /** arte papel-2 precisa de borda tinta pra não sumir no papel */
  borda: boolean;
}

const ARTES: Record<Tone, Arte> = {
  sol:    { tone: "sol",    bg: "var(--color-sol)",     fg: "var(--color-papel)", fgPequeno: "var(--color-tinta)", clara: false, borda: false },
  cartaz: { tone: "cartaz", bg: "var(--color-cartaz)",  fg: "var(--color-tinta)", fgPequeno: "var(--color-tinta)", clara: true,  borda: false },
  palco:  { tone: "palco",  bg: "var(--color-palco)",   fg: "var(--color-papel)", fgPequeno: "var(--color-papel)", clara: false, borda: false },
  tinta:  { tone: "tinta",  bg: "var(--color-tinta)",   fg: "var(--color-papel)", fgPequeno: "var(--color-papel)", clara: false, borda: false },
  papel:  { tone: "papel",  bg: "var(--color-papel-2)", fg: "var(--color-tinta)", fgPequeno: "var(--color-tinta)", clara: true,  borda: true },
};

// show/música→sol · festa/balada→cartaz · esporte→palco · teatro/cultura→tinta
// · corporativo/feira→papel-2. CURSO não existe na spec: tratado como
// corporativo (decisão registrada em docs/decisoes.md).
const CATEGORIA_TONE: Record<CategoryLabel, Tone> = {
  SHOW: "sol",
  FESTA: "cartaz",
  ESPORTE: "palco",
  TEATRO: "tinta",
  CORPORATIVO: "papel",
  CURSO: "papel",
};

export function arteDaCategoria(cat: CategoryLabel): Arte {
  return ARTES[CATEGORIA_TONE[cat] ?? "sol"];
}

/** Duotone da foto usa sol por padrão; festa→cartaz e esporte→palco. */
export function duotoneDaCategoria(cat: CategoryLabel): "sol" | "cartaz" | "palco" {
  const tone = CATEGORIA_TONE[cat];
  return tone === "cartaz" || tone === "palco" ? tone : "sol";
}

/** Nº de série de 4 dígitos a partir do serial sequencial do evento. */
export function numeroSerie(serial: number): string {
  return String(serial).padStart(4, "0");
}
