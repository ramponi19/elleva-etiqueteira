"use client";

import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { label: "Funcionalidades", href: "#features" },
  { label: "Preços", href: "#pricing" },
  { label: "Clientes", href: "#testimonials" },
];

export function Navbar() {
  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        <Image src="/eagle-navy.png" alt="Elleva" width={36} height={26} priority />
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span className="brand-name">Elleva</span>
          <span className="brand-sub">Etiqueteira</span>
        </span>
      </Link>

      <div className="nav-links">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="nav-link">
            {link.label}
          </Link>
        ))}
      </div>

      <div className="nav-actions">
        <Link
          href="/login"
          className="nav-link"
          style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}
        >
          Entrar
        </Link>
        <Link href="/signup" className="btn btn-navy btn-sm">
          Começar grátis
        </Link>
      </div>
    </nav>
  );
}
