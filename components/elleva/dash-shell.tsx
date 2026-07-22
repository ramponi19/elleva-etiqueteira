"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Icon from "@/components/shared/icon";
import { LogoElleva } from "@/components/elleva/logo";

export interface DashNavItem {
  href: string;
  label: string;
  icon: string;
}

// Shell de painel (produtor/admin) no sistema Cartaz de Show: sidebar fixa
// papel/tinta no desktop; no mobile, top-bar com menu hambúrguer + drawer.
export function DashShell({
  area,
  items,
  userName,
  children,
}: {
  area: string;
  items: DashNavItem[];
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const rootHref = items[0]?.href ?? "/";
  const [open, setOpen] = useState(false);
  const reduzido = useReducedMotion();

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const isActive = (href: string) => (href === rootHref ? pathname === href : pathname.startsWith(href));

  // trava o scroll do body enquanto o drawer está aberto; Esc fecha.
  // (os links do drawer já fecham no onClick.)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const navLink = (item: DashNavItem, big = false) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setOpen(false)}
      className={clsx(
        "flex items-center gap-3 rounded-[8px] font-medium transition-colors",
        big ? "px-3.5 py-3 text-[15px]" : "px-3 py-2.5 text-[14px]",
        isActive(item.href) ? "bg-tinta text-papel" : "text-tinta hover:bg-papel-2"
      )}
    >
      <Icon icon={item.icon} style={{ fontSize: big ? 20 : 18 }} /> {item.label}
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-papel">
      {/* SIDEBAR — desktop */}
      <aside className="sticky top-0 hidden h-screen w-[248px] flex-shrink-0 flex-col border-r-[1.5px] border-tinta bg-white sm:flex">
        <Link href="/" className="flex items-center border-b-[1.5px] border-tinta px-5 py-4 text-tinta">
          <LogoElleva />
        </Link>
        <p className="rotulo px-5 pb-1 pt-4 text-tinta-60">{area}</p>
        <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">{items.map((i) => navLink(i))}</nav>
        <div className="border-t-[1.5px] border-tinta p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tinta text-[12px] font-bold text-papel">{initials}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-tinta-60">{userName}</span>
          </div>
          <button type="button" onClick={signOut} className="mt-1 flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] text-tinta-60 hover:bg-papel-2">
            <Icon icon="lucide:log-out" style={{ fontSize: 18 }} /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOP BAR — mobile */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b-[1.5px] border-tinta bg-white px-4 py-3 sm:hidden">
          <Link href="/" className="text-tinta"><LogoElleva /></Link>
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-[8px] border-[1.5px] border-tinta text-tinta"
          >
            <Icon icon="lucide:menu" style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* DRAWER — mobile */}
        <AnimatePresence>
          {open && (
            <div className="sm:hidden">
              <motion.div
                className="fixed inset-0 z-40 bg-tinta/50"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setOpen(false)}
              />
              <motion.aside
                role="dialog" aria-modal="true" aria-label={area}
                className="fixed right-0 top-0 z-50 flex h-full w-[286px] max-w-[86vw] flex-col border-l-[1.5px] border-tinta bg-white"
                initial={reduzido ? { opacity: 0 } : { x: "100%" }}
                animate={reduzido ? { opacity: 1 } : { x: 0 }}
                exit={reduzido ? { opacity: 0 } : { x: "100%" }}
                transition={reduzido ? { duration: 0.15 } : { type: "spring", stiffness: 320, damping: 34 }}
              >
                <div className="flex items-center justify-between border-b-[1.5px] border-tinta px-4 py-4">
                  <span className="rotulo text-tinta-60">{area}</span>
                  <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-[8px] text-tinta hover:bg-papel-2">
                    <Icon icon="lucide:x" style={{ fontSize: 20 }} />
                  </button>
                </div>
                <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3">{items.map((i) => navLink(i, true))}</nav>
                <div className="border-t-[1.5px] border-tinta p-3">
                  <div className="flex items-center gap-2.5 px-2 py-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tinta text-[13px] font-bold text-papel">{initials}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-tinta-60">{userName}</span>
                  </div>
                  <button type="button" onClick={signOut} className="mt-1 flex w-full items-center gap-3 rounded-[8px] px-3.5 py-3 text-[15px] text-tinta-60 hover:bg-papel-2">
                    <Icon icon="lucide:log-out" style={{ fontSize: 20 }} /> Sair
                  </button>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
