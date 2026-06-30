"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accessOpen, setAccessOpen] = useState(false);
  const accessRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accessRef.current && !accessRef.current.contains(e.target as Node)) {
        setAccessOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/agenda?q=${encodeURIComponent(q)}` : "/agenda");
  }

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
        {searchOpen ? (
          <form onSubmit={submitSearch} style={{ position: "relative" }}>
            <input
              autoFocus
              className="input"
              style={{ width: 220, height: 38, borderRadius: 9999, paddingLeft: 16, fontSize: 13 }}
              placeholder="Buscar evento..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => { if (!query) setSearchOpen(false); }}
            />
          </form>
        ) : (
          <button
            type="button"
            className="nav-link"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            style={{ background: "none", border: "none", display: "flex", color: "var(--text-secondary)" }}
          >
            <Icon icon="lucide:search" style={{ fontSize: 19 }} />
          </button>
        )}

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
          <div ref={accessRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="btn btn-navy btn-sm"
              onClick={() => setAccessOpen((v) => !v)}
            >
              Acessar
            </button>
            {accessOpen && (
              <div
                style={{
                  position: "absolute", right: 0, top: "calc(100% + 10px)", zIndex: 60,
                  display: "flex", flexDirection: "column", gap: 8, padding: 8,
                  background: "var(--bg-elevated)", border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)", boxShadow: "var(--sh-md)", width: "max-content",
                }}
              >
                <Link href="/login" className="btn btn-navy btn-sm" style={{ justifyContent: "center" }}>
                  Login
                </Link>
                <Link href="/signup" className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }}>
                  Cadastrar-se
                </Link>
              </div>
            )}
          </div>
        )}
        <Link href="/checkout" className="cart-btn" aria-label="Carrinho">
          <Icon icon="solar:cart-large-2-bold-duotone" style={{ fontSize: 26, color: "var(--text-primary)" }} />
          {count > 0 && <span className="cart-badge">{count}</span>}
        </Link>
      </div>
    </nav>
  );
}
