import Link from "next/link";

const LINKS = {
  Produto: [
    { label: "Funcionalidades", href: "#features" },
    { label: "Preços", href: "#pricing" },
    { label: "API Docs", href: "/docs" },
    { label: "Changelog", href: "/changelog" },
  ],
  Empresa: [
    { label: "Sobre", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Carreiras", href: "/careers" },
    { label: "Contato", href: "/contact" },
  ],
  Legal: [
    { label: "Termos de uso", href: "/terms" },
    { label: "Privacidade", href: "/privacy" },
    { label: "LGPD", href: "/lgpd" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#1A2744] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span
              className="text-2xl text-white"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              Elleva
            </span>
            <p className="text-white/40 text-sm mt-3 leading-relaxed">
              Gestão de etiquetas industriais com elegância e precisão.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-white text-sm font-semibold mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-white/40 hover:text-white text-sm transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} Elleva Tecnologia LTDA. CNPJ 00.000.000/0001-00
          </p>
          <p className="text-white/30 text-xs">
            Feito com ♥ no Brasil 🇧🇷
          </p>
        </div>
      </div>
    </footer>
  );
}
