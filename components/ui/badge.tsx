import { clsx } from "clsx";

type BadgeTom = "tinta" | "papel" | "sol" | "cartaz";

// Combinações da spec §4: sol+tinta, cartaz+tinta, tinta+papel, papel+tinta.
const tons: Record<BadgeTom, string> = {
  tinta: "bg-tinta text-papel",
  papel: "bg-papel text-tinta border-[1.5px] border-tinta",
  sol: "bg-sol text-tinta",
  cartaz: "bg-cartaz text-tinta",
};

interface BadgeProps {
  tom?: BadgeTom;
  /** pill (padrão) ou retângulo 4px */
  quadrado?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ tom = "tinta", quadrado, className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        "rotulo inline-flex items-center gap-1.5 px-2.5 py-1.5",
        quadrado ? "rounded-[4px]" : "rounded-[var(--radius-pill)]",
        tons[tom],
        className
      )}
    >
      {children}
    </span>
  );
}
