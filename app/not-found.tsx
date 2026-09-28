import Link from "next/link";
import type { Metadata } from "next";
import { EllevaLogo } from "@/components/brand/EllevaLogo";

export const metadata: Metadata = {
  title: "Página não encontrada | Elleva Tickets",
  robots: { index: false, follow: false },
};

// 404 com a cara da Elleva. Estava no visual claro antigo (bg-papel creme) —
// o único pedaço do site fora do tema "A Noite", achado na auditoria visual de
// 2026-09-25. Cores fixas da paleta A Noite (não os tokens papel/tinta): esta
// tela renderiza fora de qualquer escopo que troque as variáveis.
export default function NotFound() {
  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[#08070A] px-5 py-20 text-[#F6F1E9]">
      {/* brilho ambiente, como nas outras telas escuras */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, rgba(255,90,31,.14), transparent 60%), radial-gradient(50% 40% at 90% 100%, rgba(162,75,255,.10), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-[520px] text-center">
        <Link href="/" aria-label="Elleva Tickets — início" className="inline-block text-[#F6F1E9] [--elv-logo-size:24px]">
          <EllevaLogo variant="horizontal" tone="negativo" className="h-6 w-auto sm:h-8" />
        </Link>
        <p className="numero mt-10 text-[clamp(64px,14vw,120px)] leading-none text-[#FF5A1F]">404</p>
        <h1 className="display-2 mt-2">Essa página saiu de cartaz</h1>
        <p className="mx-auto mt-3 max-w-[42ch] text-[15px] leading-relaxed text-[#9A9082]">
          O link pode estar quebrado ou o evento já encerrou. Dá uma olhada na
          agenda — sempre tem coisa boa rolando no interior.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/agenda"
            className="inline-flex min-h-[44px] items-center rounded-[var(--radius-pill)] bg-[#FF5A1F] px-6 text-[15px] font-semibold text-[#180a03] transition-colors hover:bg-[#FF7A45]"
          >
            Ver a agenda →
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-[var(--radius-pill)] border-[1.5px] border-[rgb(246_241_233/0.3)] px-6 text-[15px] font-medium text-[#F6F1E9] transition-colors hover:bg-[rgb(246_241_233/0.06)]"
          >
            Início
          </Link>
        </div>
      </div>
    </main>
  );
}
