import Link from "next/link";
import { LogoElleva } from "@/components/elleva/logo";
import { CONTATO_EMAIL, sociaisLinks } from "@/lib/site";

// Footer do sistema Cartaz (spec §7): tinta, colunas de links, régua
// papel-inv e assinatura em rótulo.
const COLUNAS: { titulo: string; links: { label: string; href: string }[] }[] = [
  {
    titulo: "Elleva",
    links: [
      { label: "Agenda", href: "/agenda" },
      { label: "Produtores", href: "/produtores" },
      { label: "Central de Ajuda", href: "/ajuda" },
    ],
  },
  {
    titulo: "Legal",
    links: [
      { label: "Política de compras", href: "/terms" },
      { label: "Privacidade", href: "/privacy" },
    ],
  },
  {
    titulo: "Contato",
    // sociais só entram quando configurados em lib/site.ts (nada de link quebrado)
    links: [
      { label: CONTATO_EMAIL, href: `mailto:${CONTATO_EMAIL}` },
      ...sociaisLinks(),
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-tinta text-papel">
      <div className="mx-auto max-w-[1320px] px-5 py-14 sm:px-10">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <LogoElleva className="self-start" />
          <div className="flex flex-wrap gap-x-16 gap-y-8">
            {COLUNAS.map((col) => (
              <div key={col.titulo} className="flex min-w-[140px] flex-col gap-2.5">
                <span className="rotulo text-cartaz">{col.titulo}</span>
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="text-[13.5px] text-papel/70 hover:text-papel"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t-[1.5px] border-[var(--color-papel-inv)] pt-6">
          <p className="rotulo m-0 text-papel/60">© 2026 Elleva Tickets</p>
        </div>
      </div>
    </footer>
  );
}
