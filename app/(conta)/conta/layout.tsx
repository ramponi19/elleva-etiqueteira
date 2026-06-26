import { requireRole } from "@/lib/auth";
import AppShell from "@/components/app/app-shell";

const NAV = [
  { href: "/conta", label: "Meus ingressos", icon: "solar:ticket-bold-duotone" },
  { href: "/conta/perfil", label: "Perfil", icon: "solar:user-circle-bold-duotone" },
];

export default async function ContaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Qualquer usuário logado tem conta
  const { fullName, user } = await requireRole(["customer", "producer", "admin"]);
  return (
    <AppShell area="MINHA CONTA" items={NAV} userName={fullName ?? user!.email ?? "Você"}>
      {children}
    </AppShell>
  );
}
