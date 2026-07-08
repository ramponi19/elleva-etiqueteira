"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import Icon from "@/components/shared/icon";
import { LogoElleva } from "@/components/elleva/logo";

// Shell da Área do Produtor (spec Cartaz de Show): sidebar fixa papel/tinta,
// item ativo em tinta sólida, atalho de sair. Substitui o AppShell navy antigo.
const NAV = [
  { href: "/produtor", label: "Início", icon: "lucide:home" },
  { href: "/produtor/vendas", label: "Vendas", icon: "lucide:wallet" },
  { href: "/produtor/validar", label: "Validar ingresso", icon: "lucide:qr-code" },
  { href: "/produtor/checkin", label: "Check-in", icon: "lucide:clipboard-list" },
];

export function ProducerShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

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

  const isActive = (href: string) =>
    href === "/produtor" ? pathname === href : pathname.startsWith(href);

  const itemCls = (active: boolean) =>
    clsx(
      "flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium transition-colors",
      active ? "bg-tinta text-papel" : "text-tinta hover:bg-papel-2"
    );

  return (
    <div className="flex min-h-screen bg-papel">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-[248px] flex-shrink-0 flex-col border-r-[1.5px] border-tinta bg-white sm:flex">
        <Link href="/" className="flex items-center border-b-[1.5px] border-tinta px-5 py-4 text-tinta">
          <LogoElleva />
        </Link>
        <p className="rotulo px-5 pb-1 pt-4 text-tinta-60">Área do produtor</p>
        <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={itemCls(isActive(item.href))}>
              <Icon icon={item.icon} style={{ fontSize: 18 }} /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t-[1.5px] border-tinta p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tinta text-[12px] font-bold text-papel">
              {initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-tinta-60">{userName}</span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] text-tinta-60 hover:bg-papel-2"
          >
            <Icon icon="lucide:log-out" style={{ fontSize: 18 }} /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top nav (mobile) */}
        <div className="flex items-center gap-1 overflow-x-auto border-b-[1.5px] border-tinta bg-white px-3 py-2 sm:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-shrink-0 items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-medium",
                isActive(item.href) ? "bg-tinta text-papel" : "text-tinta"
              )}
            >
              <Icon icon={item.icon} style={{ fontSize: 16 }} /> {item.label}
            </Link>
          ))}
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
