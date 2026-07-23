"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/shared/icon";
import { LogoElleva } from "@/components/elleva/logo";
import { Button } from "@/components/ui/button";
import { becomeProducerAndGo } from "@/lib/actions/producer";
import type { Role } from "@/lib/auth";

// Navbar do sistema Cartaz (spec 8.1): papel, borda inferior tinta 1.5px,
// logo · Agenda · Produtores à esquerda; à direita, Entrar (deslogado) ou
// ações de conta + menu do avatar (logado). No mobile a descoberta vai pro
// hambúrguer (deslogado) ou pro topo do menu do avatar (logado).
const DESCOBERTA = [
  { href: "/agenda", label: "Agenda", icon: "lucide:calendar-days" },
  { href: "/produtores", label: "Produtores", icon: "lucide:store" },
];

export default function Nav({
  loggedIn,
  role,
  name,
  email,
  avatarUrl,
  initials,
}: {
  loggedIn: boolean;
  role?: Role | null;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  initials?: string;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (navRef.current && !navRef.current.contains(t)) setNavOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function signOut() {
    // import dinâmico: supabase-js fica fora do bundle de toda página
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const itemCls =
    "flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[14px] text-tinta hover:bg-papel-2 cursor-pointer";
  const topLink =
    "flex items-center gap-1.5 text-[14px] font-medium text-tinta hover:text-sol-escuro";

  return (
    <nav className="sticky top-0 z-50 border-b-[1.5px] border-tinta bg-papel">
      <div className="mx-auto flex h-[60px] max-w-[1320px] items-center justify-between gap-4 px-5 sm:px-10">
        {/* ESQUERDA — logo + descoberta (desktop) */}
        <div className="flex items-center gap-7">
          <Link href="/" aria-label="Elleva Tickets — início" className="text-tinta">
            <LogoElleva />
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {DESCOBERTA.map((d) => (
              <Link key={d.href} href={d.href} className={topLink}>
                {d.label}
              </Link>
            ))}
          </div>
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-2 sm:gap-4">
          {loggedIn && (
            <div className="hidden items-center gap-6 md:flex">
              <form action={becomeProducerAndGo}>
                <input type="hidden" name="to" value="/criar-evento" />
                <button type="submit" className={`${topLink} cursor-pointer`}>
                  <Icon icon="lucide:circle-plus" style={{ fontSize: 17 }} /> Criar evento
                </button>
              </form>
              <form action={becomeProducerAndGo}>
                <input type="hidden" name="to" value="/produtor" />
                <button type="submit" className={`${topLink} cursor-pointer`}>
                  <Icon icon="lucide:calendar-check" style={{ fontSize: 17 }} /> Meus eventos
                </button>
              </form>
              <Link href="/conta" className={topLink}>
                <Icon icon="lucide:ticket" style={{ fontSize: 17 }} /> Meus ingressos
              </Link>
            </div>
          )}

          {loggedIn ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu da conta"
                aria-expanded={menuOpen}
                className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--radius-pill)] border-[1.5px] border-tinta bg-papel py-1 pl-1 pr-2.5 hover:bg-papel-2"
              >
                <span className="flex h-[32px] w-[32px] items-center justify-center overflow-hidden rounded-full bg-tinta text-[12px] font-medium text-papel">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={name ?? "Avatar"} width={32} height={32} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    initials ?? "?"
                  )}
                </span>
                <Icon icon="lucide:menu" style={{ fontSize: 17 }} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[60] w-[280px] rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-papel p-2 shadow-[4px_4px_0_var(--color-tinta)]">
                  <div className="border-b-[1.5px] border-dashed border-tinta px-3 pb-3 pt-2">
                    <p className="m-0 truncate text-[14px] font-medium text-tinta">{name}</p>
                    {email && <p className="corpo-suave m-0 mt-0.5 truncate">{email}</p>}
                  </div>

                  {/* descoberta — só no mobile (no desktop já está na barra) */}
                  <div className="flex flex-col gap-0.5 border-b-[1.5px] border-dashed border-tinta pb-2 pt-2 md:hidden">
                    {DESCOBERTA.map((d) => (
                      <Link key={d.href} href={d.href} className={itemCls} onClick={() => setMenuOpen(false)}>
                        <Icon icon={d.icon} style={{ fontSize: 17 }} /> {d.label}
                      </Link>
                    ))}
                  </div>

                  <div className="flex flex-col gap-0.5 pt-2">
                    <Link href="/conta" className={itemCls} onClick={() => setMenuOpen(false)}>
                      <Icon icon="lucide:ticket" style={{ fontSize: 17 }} /> Meus ingressos
                    </Link>
                    <Link href="/conta/perfil" className={itemCls} onClick={() => setMenuOpen(false)}>
                      <Icon icon="lucide:user-round" style={{ fontSize: 17 }} /> Minha conta
                    </Link>
                    <Link href="/conta/favoritos" className={itemCls} onClick={() => setMenuOpen(false)}>
                      <Icon icon="lucide:heart" style={{ fontSize: 17 }} /> Favoritos
                    </Link>
                    <form action={becomeProducerAndGo}>
                      <input type="hidden" name="to" value="/criar-evento" />
                      <button type="submit" className={itemCls}>
                        <Icon icon="lucide:circle-plus" style={{ fontSize: 17 }} /> Criar evento
                      </button>
                    </form>
                    <form action={becomeProducerAndGo}>
                      <input type="hidden" name="to" value="/produtor" />
                      <button type="submit" className={itemCls}>
                        <Icon icon="lucide:calendar-check" style={{ fontSize: 17 }} /> Meus eventos
                      </button>
                    </form>
                    {role === "admin" && (
                      <Link href="/admin" className={itemCls} onClick={() => setMenuOpen(false)}>
                        <Icon icon="lucide:shield-check" style={{ fontSize: 17 }} /> Administração
                      </Link>
                    )}
                    <Link href="/ajuda" className={itemCls} onClick={() => setMenuOpen(false)}>
                      <Icon icon="lucide:circle-help" style={{ fontSize: 17 }} /> Central de Ajuda
                    </Link>
                    <button type="button" className={itemCls} onClick={signOut}>
                      <Icon icon="lucide:log-out" style={{ fontSize: 17 }} /> Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button href="/login" className="hidden sm:inline-flex">Entrar</Button>

              {/* mobile deslogado — hambúrguer com descoberta + acesso */}
              <div ref={navRef} className="relative md:hidden">
                <button
                  type="button"
                  onClick={() => setNavOpen((v) => !v)}
                  aria-label="Menu"
                  aria-expanded={navOpen}
                  className="flex h-11 w-11 items-center justify-center rounded-[8px] border-[1.5px] border-tinta text-tinta hover:bg-papel-2"
                >
                  <Icon icon="lucide:menu" style={{ fontSize: 20 }} />
                </button>
                {navOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-[60] w-[240px] rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-papel p-2 shadow-[4px_4px_0_var(--color-tinta)]">
                    <div className="flex flex-col gap-0.5 border-b-[1.5px] border-dashed border-tinta pb-2">
                      {DESCOBERTA.map((d) => (
                        <Link key={d.href} href={d.href} className={itemCls} onClick={() => setNavOpen(false)}>
                          <Icon icon={d.icon} style={{ fontSize: 17 }} /> {d.label}
                        </Link>
                      ))}
                    </div>
                    <div className="flex flex-col gap-0.5 pt-2">
                      <Link href="/login" className={itemCls} onClick={() => setNavOpen(false)}>
                        <Icon icon="lucide:log-in" style={{ fontSize: 17 }} /> Entrar
                      </Link>
                      <Link href="/signup" className={itemCls} onClick={() => setNavOpen(false)}>
                        <Icon icon="lucide:user-plus" style={{ fontSize: 17 }} /> Criar conta
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
