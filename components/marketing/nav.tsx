"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { useCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";

export default function Nav({
  loggedIn,
  homeHref,
}: {
  loggedIn: boolean;
  homeHref: string;
}) {
  const { count } = useCart();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        <Image src="/eagle-navy.png" alt="Elleva Tickets" width={36} height={26} priority />
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span className="brand-name">Elleva</span>
          <span className="brand-sub">Tickets</span>
        </span>
      </Link>

      <div className="nav-links">
        <Link href="/agenda" className="nav-link">Shows</Link>
        <Link href="/agenda" className="nav-link">Eventos</Link>
        <Link href="/agenda" className="nav-link">Categorias</Link>
        <Link href="/agenda" className="nav-link">Cidades</Link>
      </div>

      <div className="nav-actions">
        {loggedIn ? (
          <>
            <Link
              href={homeHref}
              className="nav-link"
              style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}
            >
              Minha conta
            </Link>
            <button
              onClick={signOut}
              className="btn btn-navy btn-sm"
              style={{ border: "none" }}
            >
              Sair
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="nav-link"
              style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}
            >
              Entrar
            </Link>
            <Link href="/signup" className="btn btn-navy btn-sm">Criar conta</Link>
          </>
        )}
        <Link href="/checkout" className="cart-btn" aria-label="Carrinho">
          <Icon icon="solar:cart-large-2-bold-duotone" style={{ fontSize: 26, color: "var(--text-primary)" }} />
          {count > 0 && <span className="cart-badge">{count}</span>}
        </Link>
      </div>
    </nav>
  );
}
