import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada | Elleva Tickets",
  robots: { index: false, follow: false },
};

// 404 com a cara da Elleva (antes era a tela padrão do Next, em inglês).
export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-papel px-5 py-20">
      <div className="w-full max-w-[520px] text-center">
        <p className="numero text-[clamp(64px,14vw,120px)] leading-none text-sol">404</p>
        <h1 className="display-2 mt-2 text-tinta">Essa página saiu de cartaz</h1>
        <p className="corpo-suave mx-auto mt-3 max-w-[42ch]">
          O link pode estar quebrado ou o evento já encerrou. Dá uma olhada na
          agenda — sempre tem coisa boa rolando no interior.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/agenda"
            className="inline-flex min-h-[44px] items-center rounded-[var(--radius-pill)] bg-tinta px-6 text-[15px] font-medium text-papel transition-colors hover:bg-sol-escuro"
          >
            Ver a agenda →
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-[var(--radius-pill)] border-[1.5px] border-tinta px-6 text-[15px] font-medium text-tinta transition-colors hover:bg-papel-2"
          >
            Início
          </Link>
        </div>
      </div>
    </main>
  );
}
