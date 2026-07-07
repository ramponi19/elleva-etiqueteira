import { Archivo } from "next/font/google";

// Única família do projeto (spec Nível 3, seção 3): Archivo Variable com o
// eixo wdth (62–125). As três "vozes" (display condensado-expandido 900,
// corpo 400, rótulo 500) saem todas daqui via font-stretch + font-weight.
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
