"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { createClient } from "@/lib/supabase/client";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export default function AppShell({
  area,
  items,
  userName,
  children,
}: {
  area: string; // "ADMIN" | "PRODUTOR" | "MINHA CONTA"
  items: NavItem[];
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 248,
          flexShrink: 0,
          background: "var(--navy-900)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <Image src="/eagle-bone.png" alt="Elleva" width={30} height={22} />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#F6F3EB" }}>Elleva</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: ".28em", color: "var(--gold-500)", textTransform: "uppercase", marginTop: 3 }}>
              {area}
            </span>
          </span>
        </Link>

        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map(({ href, label, icon }) => {
            const active = href === pathname || (href !== items[0].href && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 14,
                  color: active ? "var(--gold-500)" : "rgba(246,243,235,.55)",
                  background: active ? "rgba(198,168,106,.12)" : "transparent",
                  transition: "color .15s, background .15s",
                }}
              >
                <Icon icon={icon} style={{ fontSize: 18 }} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, background: "var(--navy-700)", color: "#F6F3EB", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>
              {(userName || "?").slice(0, 2).toUpperCase()}
            </div>
            <span style={{ flex: 1, fontSize: 13, color: "rgba(246,243,235,.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </span>
          </div>
          <button
            onClick={signOut}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, fontSize: 14, color: "rgba(246,243,235,.45)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <Icon icon="solar:logout-2-bold-duotone" style={{ fontSize: 18 }} />
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
