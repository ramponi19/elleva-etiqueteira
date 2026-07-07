import Link from "next/link";
import { clsx } from "clsx";

type Variante = "primario" | "contorno" | "tinta" | "contorno-papel";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  /** com href vira <Link> mantendo o mesmo visual */
  href?: string;
}

// Spec §7 — máximo UM `primario` por viewport.
const estilos: Record<Variante, string> = {
  primario:
    "bg-sol text-tinta hover:bg-sol-escuro active:scale-[0.98]",
  contorno:
    "bg-transparent text-tinta border-[1.5px] border-tinta hover:bg-papel-2",
  tinta:
    "bg-tinta text-papel hover:opacity-90 active:scale-[0.98]",
  // pra uso sobre fundo tinta (modo noite / confirmação)
  "contorno-papel":
    "bg-transparent text-papel border-[1.5px] border-[var(--color-papel-inv)] hover:bg-[rgb(250_245_236/0.06)]",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] " +
  "px-[22px] py-3 text-[15px] font-medium leading-none whitespace-nowrap " +
  "cursor-pointer select-none transition-[background-color,opacity,transform] " +
  "duration-[var(--dur-micro)]";

export function Button({
  variante = "primario",
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const cls = clsx(base, estilos[variante], className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
