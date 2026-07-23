import Link from "next/link";
import { clsx } from "clsx";

// Pills de filtro de cidade (spec §7): ativa = sol com texto tinta;
// inativas = borda fina, hover preenche com --cor-hover (papel-2 ou
// papel-inv no modo noite).
export interface CityPill {
  label: string;
  href: string;
  ativa?: boolean;
}

export function CityPills({ cidades, className }: { cidades: CityPill[]; className?: string }) {
  return (
    <nav className={clsx("flex flex-wrap gap-2.5", className)} aria-label="Filtrar por cidade">
      {cidades.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          aria-current={c.ativa ? "page" : undefined}
          className={clsx(
            "inline-flex min-h-[44px] items-center rounded-[var(--radius-pill)] px-4 py-2 text-[14px] leading-none transition-colors duration-[var(--dur-micro)]",
            c.ativa
              ? "bg-sol font-medium text-tinta"
              : "border border-[var(--cor-borda)] text-[var(--cor-texto)] hover:bg-[var(--cor-hover)]"
          )}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
