import Link from "next/link";
import type { CategoryLabel } from "@/lib/events";
import { arteDaCategoria } from "@/lib/arte";
import { fmtBRL } from "@/lib/format";

// Linha de agenda (spec §7): bloco de data na cor de arte, picote vertical,
// conteúdo e preço. Usa as variáveis --cor-* pra funcionar em papel e no
// modo noite (data-theme="noite") sem prop extra.
interface EventStubRowProps {
  href: string;
  titulo: string;
  categoria: CategoryLabel;
  /** dia, ex. "12" */
  dia: string;
  /** mês abreviado, ex. "JUL" */
  mes: string;
  /** ex. "19H30 · Teatro Municipal · Mogi Mirim" */
  meta: string;
  precoDesde: number;
  esgotado?: boolean;
}

export function EventStubRow({
  href,
  titulo,
  categoria,
  dia,
  mes,
  meta,
  precoDesde,
  esgotado,
}: EventStubRowProps) {
  const arte = arteDaCategoria(categoria);
  return (
    <Link
      href={href}
      className="flex items-stretch overflow-hidden rounded-[var(--radius-card)] border-[1.5px] border-[var(--cor-borda)] transition-colors duration-[var(--dur-micro)] hover:bg-[var(--cor-hover)]"
    >
      <div
        className="flex w-16 flex-shrink-0 flex-col items-center justify-center gap-0.5 py-4"
        style={{ background: arte.bg, color: arte.fg }}
      >
        <span className="numero text-[22px]">{dia}</span>
        <span className="rotulo">{mes}</span>
      </div>
      <div className="picote-v flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0">
          <h3 className="titulo-card truncate text-[15px] text-[var(--cor-texto)]">
            {titulo}
          </h3>
          <p className="corpo-suave mt-1 truncate">{meta}</p>
        </div>
        <span className="rotulo flex-shrink-0 text-sol-escuro [[data-theme=noite]_&]:text-sol">
          {esgotado ? "Sold out" : fmtBRL(precoDesde)}
        </span>
      </div>
    </Link>
  );
}
