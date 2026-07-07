"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/shared/icon";
import Logo from "@/components/shared/logo";
import Magnetic from "@/components/motion/magnetic";
import { createClient } from "@/lib/supabase/client";
import { becomeProducerAndGo } from "@/lib/actions/producer";
import type { Role } from "@/lib/auth";

export default function Nav({
  loggedIn,
  role,
  name,
  email,
  avatarUrl,
  initials,
  completion,
}: {
  loggedIn: boolean;
  role?: Role | null;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  initials?: string;
  completion?: number;
}) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
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
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const showCompletion = typeof completion === "number" && completion < 100;

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        <Logo width={40} />
        <span className="brand-name">Elleva Tickets</span>
      </Link>

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
            {/* Links de topo (estilo Sympla) */}
            <form action={becomeProducerAndGo} style={{ display: "flex" }}>
              <input type="hidden" name="to" value="/produtor/eventos/novo" />
              <button type="submit" className="nav-link nav-top-link">
                <Icon icon="lucide:circle-plus" style={{ fontSize: 18 }} />
                Criar evento
              </button>
            </form>

            <form action={becomeProducerAndGo} style={{ display: "flex" }}>
              <input type="hidden" name="to" value="/produtor/eventos" />
              <button type="submit" className="nav-link nav-top-link">
                <Icon icon="lucide:calendar-check" style={{ fontSize: 18 }} />
                Meus eventos
              </button>
            </form>

            <Link href="/conta" className="nav-link nav-top-link">
              <Icon icon="lucide:ticket" style={{ fontSize: 18 }} />
              Meus ingressos
            </Link>

            {/* Menu do avatar */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu da conta"
                aria-expanded={menuOpen}
                className="nav-avatar"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={name ?? "Avatar"} width={30} height={30} style={{ borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <span>{initials ?? "?"}</span>
                )}
                <Icon icon="lucide:menu" style={{ fontSize: 18, color: "var(--text-secondary)" }} />
              </button>

              {menuOpen && (
                <div className="account-menu">
                  {/* Cabeçalho: identidade */}
                  <div className="account-menu__head">
                    <span className="nav-avatar__circle nav-avatar__circle--lg">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={name ?? "Avatar"} width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        initials ?? "?"
                      )}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p className="account-menu__name">{name}</p>
                      {email && <p className="account-menu__email">{email}</p>}
                    </div>
                  </div>

                  {/* Complete seus dados */}
                  {showCompletion && (
                    <Link href="/conta/perfil" className="account-progress" onClick={() => setMenuOpen(false)}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Icon icon="lucide:circle-help" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                          Complete seus dados para garantir <strong>mais segurança</strong> no acesso à sua conta!
                        </span>
                      </div>
                      <div className="account-progress__meter">
                        <div className="account-progress__track">
                          <div className="account-progress__fill" style={{ width: `${completion}%` }} />
                        </div>
                        <span className="account-progress__pct">{completion}%</span>
                      </div>
                      <span className="account-progress__cta">Completar dados</span>
                    </Link>
                  )}

                  {/* Itens */}
                  <div className="account-menu__list">
                    <Link href="/conta/perfil" className="account-item" onClick={() => setMenuOpen(false)}>
                      <Icon icon="lucide:user-round" style={{ fontSize: 18 }} /> Minha conta
                    </Link>
                    <Link href="/conta/favoritos" className="account-item" onClick={() => setMenuOpen(false)}>
                      <Icon icon="lucide:heart" style={{ fontSize: 18 }} /> Favoritos
                    </Link>
                    <form action={becomeProducerAndGo}>
                      <input type="hidden" name="to" value="/produtor/eventos/novo" />
                      <button type="submit" className="account-item">
                        <Icon icon="lucide:circle-plus" style={{ fontSize: 18 }} /> Criar evento
                      </button>
                    </form>
                    <form action={becomeProducerAndGo}>
                      <input type="hidden" name="to" value="/produtor/eventos" />
                      <button type="submit" className="account-item">
                        <Icon icon="lucide:calendar-check" style={{ fontSize: 18 }} /> Meus eventos
                      </button>
                    </form>
                  </div>

                  <div className="account-menu__divider" />

                  <div className="account-menu__list">
                    <Link href="/ajuda" className="account-item" onClick={() => setMenuOpen(false)}>
                      <Icon icon="lucide:circle-help" style={{ fontSize: 18 }} /> Central de Ajuda
                    </Link>
                    <button type="button" className="account-item" onClick={signOut}>
                      <Icon icon="lucide:log-out" style={{ fontSize: 18 }} /> Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div ref={menuRef} style={{ position: "relative" }}>
            <Magnetic strength={0.3}>
              <button
                type="button"
                className="btn btn-navy btn-sm"
                onClick={() => setMenuOpen((v) => !v)}
              >
                Acessar
              </button>
            </Magnetic>
            {menuOpen && (
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
      </div>
    </nav>
  );
}
