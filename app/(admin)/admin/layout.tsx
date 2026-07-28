import { requireRole } from "@/lib/auth";
import { DashShell } from "@/components/elleva/dash-shell";

const NAV = [
  { href: "/admin", label: "Visão geral", icon: "lucide:layout-dashboard" },
  { href: "/admin/eventos", label: "Eventos", icon: "lucide:ticket" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "lucide:shopping-cart" },
  { href: "/admin/clientes", label: "Clientes", icon: "lucide:users" },
  { href: "/admin/cupons", label: "Cupons", icon: "lucide:badge-percent" },
  { href: "/admin/financeiro", label: "Financeiro", icon: "lucide:wallet" },
  { href: "/admin/validar", label: "Validar ingresso", icon: "lucide:qr-code" },
  { href: "/admin/checkin", label: "Check-in", icon: "lucide:clipboard-list" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName, user } = await requireRole(["admin"]);
  return (
    <DashShell area="Administração" items={NAV} userName={fullName ?? user!.email ?? "Admin"}>
      {children}
    </DashShell>
  );
}
