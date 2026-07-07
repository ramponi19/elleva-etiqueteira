import type { CategoryLabel } from "@/lib/events";
import { arteDaCategoria } from "@/lib/arte";
import { clsx } from "clsx";

// Estado sem foto (spec §5.2): pôster tipográfico gerado — o "estado vazio"
// é linguagem, não vergonha. Mesmo layout do cartaz da página de evento.
interface PosterFallbackProps {
  nome: string;
  categoria: CategoryLabel;
  /** ex. "12 JUL" */
  data?: string;
  cidade?: string;
  /** já formatado com 4 dígitos (lib/arte → numeroSerie) */
  numeroSerie?: string;
  className?: string;
}

export function PosterFallback({
  nome,
  categoria,
  data,
  cidade,
  numeroSerie,
  className,
}: PosterFallbackProps) {
  const arte = arteDaCategoria(categoria);
  return (
    <div
      className={clsx(
        "relative flex h-full w-full flex-col justify-between overflow-hidden p-4",
        arte.borda && "border-[1.5px] border-tinta",
        className
      )}
      style={{ background: arte.bg, color: arte.fg }}
    >
      <div className="flex items-start justify-between gap-2" style={{ color: arte.fgPequeno }}>
        <span className="rotulo">{categoria}</span>
        {numeroSerie && <span className="rotulo opacity-80">Nº {numeroSerie}</span>}
      </div>

      <h3 className="display-2 max-w-full break-words" style={{ color: arte.fg }}>
        {nome}
      </h3>

      {(data || cidade) && (
        <div
          className="mt-3 flex items-center gap-3 border-t-[1.5px] pt-2.5"
          style={{ borderColor: "currentcolor" }}
        >
          {data && <span className="numero text-xl">{data}</span>}
          {data && cidade && (
            <span aria-hidden className="h-5 w-[1.5px] bg-current" />
          )}
          {cidade && (
            <span className="rotulo" style={{ color: arte.fgPequeno }}>{cidade}</span>
          )}
        </div>
      )}
    </div>
  );
}
