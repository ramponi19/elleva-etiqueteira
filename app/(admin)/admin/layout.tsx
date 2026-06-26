import { requireRole } from "@/lib/auth";
import AppShell from "@/components/app/app-shell";

const NAV = [
  { href: "/admin", label: "Visão geral", icon: "solar:chart-2-bold-duotone" },
  { href: "/admin/eventos", label: "Eventos", icon: "solar:ticket-bold-duotone" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "solar:cart-large-2-bold-duotone" },
  { href: "/admin/clientes", label: "Clientes", icon: "solar:users-group-rounded-bold-duotone" },
  { href: "/admin/cupons", label: "Cupons", icon: "solar:ticket-sale-bold-duotone" },
  { href: "/admin/validar", label: "Validar ingresso", icon: "solar:qr-code-bold-duotone" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName, user } = await requireRole(["admin"]);
  return (
    <AppShell area="ADMIN" items={NAV} userName={fullName ?? user!.email ?? "Admin"}>
      {children}
    </AppShell>
  );
}
