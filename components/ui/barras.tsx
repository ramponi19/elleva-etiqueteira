import { clsx } from "clsx";

// Código de barras decorativo (spec §6) — nunca um barcode real fake.
// Larguras fixas (nada de Math.random: precisa ser estável entre SSR/client).
const LARGURAS = [2, 4, 1.5, 3, 2, 1.5, 4, 2.5, 1.5, 3.5, 2, 4, 1.5, 2.5];

interface BarrasProps {
  className?: string;
  /** cor das barras; padrão tinta (usar "bg-papel" sobre fundo tinta) */
  cor?: string;
}

export function Barras({ className, cor = "bg-tinta" }: BarrasProps) {
  return (
    <span aria-hidden className={clsx("inline-flex items-end gap-[3px] h-4", className)}>
      {LARGURAS.map((w, i) => (
        <span key={i} className={clsx("h-full", cor)} style={{ width: `${w}px` }} />
      ))}
    </span>
  );
}
