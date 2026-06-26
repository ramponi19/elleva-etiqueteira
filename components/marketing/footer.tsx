import Link from "next/link";
import Image from "next/image";

const COLUMNS = [
  {
    head: "Produto",
    links: [
      { label: "Funcionalidades", href: "#features" },
      { label: "Preços", href: "#pricing" },
      { label: "API Docs", href: "/docs" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    head: "Elleva",
    links: [
      { label: "Quem somos", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Carreiras", href: "/careers" },
      { label: "Privacidade", href: "/privacy" },
    ],
  },
  {
    head: "Contato",
    links: [
      { label: "contato@elleva.com.br", href: "#" },
      { label: "Suporte", href: "/support" },
      { label: "WhatsApp", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image src="/eagle-bone.png" alt="Elleva" width={32} height={23} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#F6F3EB" }}>
              Elleva{" "}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: ".3em",
                  color: "var(--gold-500)",
                }}
              >
                ETIQUETEIRA
              </span>
            </span>
          </div>
          <p style={{ color: "#8894A8", fontSize: 13, marginTop: 16, maxWidth: 280, lineHeight: 1.6 }}>
            Gestão de etiquetas industriais com elegância e precisão. Do modelo
            à etiqueta impressa, tudo integrado.
          </p>
        </div>

        <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
          {COLUMNS.map((col) => (
            <div key={col.head} className="footer-col">
              <span className="footer-head">{col.head}</span>
              {col.links.map((link) => (
                <Link key={link.label} href={link.href} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-meta">© 2026 ELLEVA TECNOLOGIA</span>
        <span className="footer-meta">FEITO NO BRASIL 🇧🇷</span>
      </div>
    </footer>
  );
}
