import Link from "next/link";
import type { CategoryLabel } from "@/lib/events";
import { arteDaCategoria, duotoneDaCategoria } from "@/lib/arte";
import { Badge } from "@/components/ui/badge";
import { Duotone } from "@/components/ui/duotone";
import { fmtBRL } from "@/lib/format";

// Card de evento em grids (spec §7): arte em cima, picote + canhoto embaixo,
// notches nas laterais na altura do picote. Hover: sobe 4px com sombra dura
// (offset sólido, nunca blur) e o canhoto levanta 2px extras.
interface TicketCardProps {
  href: string;
  titulo: string;
  categoria: CategoryLabel;
  /** ex. "SÁB 12 JUL · 19H30" */
  data: string;
  /** ex. "Teatro Municipal · Mogi Mirim" */
  local: string;
  precoDesde: number;
  cover?: string | null;
  esgotado?: boolean;
}

function Notch({ lado }: { lado: "esquerda" | "direita" }) {
  return (
    <span
      aria-hidden
      className="absolute top-0 z-10 h-[17px] w-[17px] -translate-y-1/2 rounded-full border-[1.5px] border-tinta bg-[var(--cor-fundo)]"
      style={lado === "esquerda" ? { left: -9 } : { right: -9 }}
    />
  );
}

export function TicketCard({
  href,
  titulo,
  categoria,
  data,
  local,
  precoDesde,
  cover,
  esgotado,
}: TicketCardProps) {
  const arte = arteDaCategoria(categoria);
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white transition-[transform,box-shadow] duration-200 [transition-timing-function:var(--ease-mola)] hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--color-tinta)]"
    >
      {/* ARTE — foto duotone ou pôster tipográfico da categoria */}
      <div
        className="relative flex h-[180px] flex-col justify-between overflow-hidden"
        style={cover ? undefined : { background: arte.bg, color: arte.fg }}
      >
        {cover && (
          <div className="absolute inset-0">
            <Duotone
              src={cover}
              alt=""
              tone={duotoneDaCategoria(categoria)}
              className="h-full w-full"
            />
          </div>
        )}
        <div className="relative z-[1] flex items-start justify-between p-3.5">
          <Badge tom={cover || !arte.clara ? "papel" : "tinta"}>{categoria}</Badge>
          {esgotado && <Badge tom="tinta">Sold out</Badge>}
        </div>
        <h3
          className="titulo-card relative z-[1] p-3.5"
          style={{ color: cover ? "var(--color-papel)" : arte.fg }}
        >
          {titulo}
        </h3>
      </div>

      {/* CANHOTO — dados frios abaixo do picote */}
      <div className="relative">
        <Notch lado="esquerda" />
        <Notch lado="direita" />
        <div className="picote-h border-tinta transition-transform duration-200 [transition-timing-function:var(--ease-mola)] group-hover:-translate-y-[2px]">
          <div className="flex flex-col gap-1 p-3.5">
            <span className="rotulo text-sol-escuro">{data}</span>
            <span className="corpo-suave text-tinta-60">{local}</span>
            <span className="mt-1.5 flex items-center justify-between text-[14px] font-medium text-tinta">
              {esgotado ? "Esgotado" : `a partir de ${fmtBRL(precoDesde)}`}
              <span aria-hidden className="text-sol">→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
