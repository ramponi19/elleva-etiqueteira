"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Printer,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/etiquetas", label: "Etiquetas", icon: Tag },
  { href: "/dashboard/impressoras", label: "Impressoras", icon: Printer },
  { href: "/dashboard/jobs", label: "Jobs", icon: FileText },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="flex flex-col w-60 flex-shrink-0 bg-[#111B33] border-r border-white/8 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/8">
        <Link href="/dashboard">
          <span
            className="text-xl text-white"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Elleva
          </span>
        </Link>
        <Link
          href="/"
          className="text-white/30 hover:text-white/60 transition-colors"
          title="Voltar ao site"
        >
          <ChevronLeft size={16} />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active
                  ? "bg-[#C9A96E]/15 text-[#C9A96E]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/8 pt-3">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all w-full"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
