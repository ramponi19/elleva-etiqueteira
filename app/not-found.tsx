import Link from "next/link";
import type { Metadata } from "next";
import { EllevaLogo } from "@/components/brand/EllevaLogo";

export const metadata: Metadata = {
  title: "Página não encontrada | Elleva Tickets",
  robots: { index: false, follow: false },
};

// 404 no visual claro do site (01/10/2026): fundo branco, logo positivo, cinzas
// neutros e o laranja dos botões (#D63C12, texto branco 4,6:1). Cores fixas,
// não os tokens papel/tinta: esta tela renderiza fora de qualquer escopo que
// troque as variáveis.
export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-white px-5 py-20 text-[#141210]">
      <div className="w-full max-w-[520px] text-center">
        <Link href="/" aria-label="Elleva Tickets — início" className="inline-flex min-h-[44px] items-center">
          <EllevaLogo variant="horizontal" className="h-8 w-auto" />
        </Link>
        <p className="numero mt-10 text-[clamp(64px,14vw,120px)] leading-none text-[#D63C12]">404</p>
        <h1 className="mt-2 text-[clamp(26px,4vw,34px)] font-extrabold leading-tight">Essa página saiu de cartaz</h1>
        <p className="mx-auto mt-3 max-w-[42ch] text-[16px] leading-relaxed text-[#4A4A4A]">
          O link pode estar quebrado ou o evento já encerrou. Dá uma olhada na
          agenda — sempre tem coisa boa rolando no interior.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/agenda"
            className="inline-flex min-h-[48px] items-center rounded-[var(--radius-pill)] bg-[#D63C12] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#B8330E]"
          >
            Ver a agenda
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center rounded-[var(--radius-pill)] border-[1.5px] border-[#141210] px-6 text-[15px] font-semibold text-[#141210] transition-colors hover:bg-[#141210] hover:text-white"
          >
            Início
          </Link>
        </div>
      </div>
    </main>
  );
}
