import { clsx } from "clsx";

// Marca do sistema Cartaz (spec 8.1): ícone de ingresso em sol + ELLEVA
// em Archivo 900 expandida. Usada no nav (tinta sobre papel) e no footer
// (papel sobre tinta) via currentColor no texto.
export function TicketIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 20"
      aria-hidden
      className={clsx("h-5 w-7 flex-shrink-0", className)}
    >
      <path
        d="M2 2h24v5a3 3 0 0 0 0 6v5H2v-5a3 3 0 0 0 0-6V2Z"
        fill="var(--color-sol)"
      />
      <path
        d="M18 3v2m0 4v2m0 4v2"
        stroke="var(--color-papel)"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

export function LogoElleva({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <TicketIcon />
      <span className="text-[19px] font-black uppercase leading-none [font-stretch:115%] tracking-tight">
        Elleva
      </span>
    </span>
  );
}
