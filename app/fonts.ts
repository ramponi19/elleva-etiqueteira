import { Archivo, Arimo } from "next/font/google";

// Helvetica-like embutível (usado no redesign "A Noite" / home escura).
// No Mac cai na Helvetica real; nos demais, Arimo (clone métrico) ou Arial.
export const arimo = Arimo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arimo",
  display: "swap",
});

// Única família do projeto (spec Nível 3, seção 3): Archivo Variable com o
// eixo wdth (62–125). As três "vozes" (display condensado-expandido 900,
// corpo 400, rótulo 500) saem todas daqui via font-stretch + font-weight.
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
