"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

// Sub-navegação da área da conta (spec §8: rótulos, sublinhado sol no ativo).
const TABS = [
  { href: "/conta", label: "Meus ingressos" },
  { href: "/conta/favoritos", label: "Favoritos" },
  { href: "/conta/perfil", label: "Perfil" },
];

export function ContaTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-x-1 border-b-[1.5px] border-tinta">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "rotulo -mb-[1.5px] whitespace-nowrap border-b-[3px] px-3 py-3 transition-colors sm:px-4",
              active
                ? "border-sol text-tinta"
                : "border-transparent text-tinta-60 hover:text-tinta"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
