import { requireRole } from "@/lib/auth";
import AppShell from "@/components/app/app-shell";

const NAV = [
  { href: "/produtor", label: "Visão geral", icon: "solar:chart-2-bold-duotone" },
  { href: "/produtor/eventos", label: "Meus eventos", icon: "solar:ticket-bold-duotone" },
  { href: "/produtor/vendas", label: "Vendas", icon: "solar:wallet-money-bold-duotone" },
  { href: "/produtor/validar", label: "Validar ingresso", icon: "solar:qr-code-bold-duotone" },
  { href: "/produtor/checkin", label: "Check-in", icon: "solar:clipboard-list-bold-duotone" },
];

export default async function ProdutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName, user } = await requireRole(["producer", "admin"]);
  return (
    <AppShell area="PRODUTOR" items={NAV} userName={fullName ?? user!.email ?? "Produtor"}>
      {children}
    </AppShell>
  );
}
