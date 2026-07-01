// Tema visual dos eventos — SEM dependência de servidor, pode ser importado
// tanto por Server quanto por Client Components (ex.: o carrossel).
import type { CategoryLabel } from "@/lib/events";

// Cor de cada evento quando NÃO há capa (cover). Bate com a paleta do
// preview v11: festa=roxo, esporte=verde, show=azul, etc. Usada só na arte
// (carrossel); o resto das páginas de marketing segue preto e branco.
export const CATEGORY_GRADIENT: Record<CategoryLabel, string> = {
  SHOW:        "linear-gradient(150deg,#5B8DEF,#2C5FD6)",
  FESTA:       "linear-gradient(150deg,#9B4DF0,#6A28D9)",
  ESPORTE:     "linear-gradient(150deg,#1FB57A,#0B8A57)",
  TEATRO:      "linear-gradient(150deg,#F5793B,#E0492A)",
  CORPORATIVO: "linear-gradient(150deg,#17B6A6,#0C8577)",
  CURSO:       "linear-gradient(150deg,#F5B72B,#E0902A)",
};

export function eventGradient(cat: CategoryLabel): string {
  return CATEGORY_GRADIENT[cat] ?? CATEGORY_GRADIENT.SHOW;
}
