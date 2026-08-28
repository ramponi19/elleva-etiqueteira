import "./produtor.css";
import { requireAuth } from "@/lib/auth";
import { DashShell } from "@/components/elleva/dash-shell";

const NAV = [
  { href: "/produtor", label: "Início", icon: "lucide:home" },
  { href: "/produtor/vendas", label: "Vendas", icon: "lucide:bar-chart-3" },
  { href: "/produtor/financeiro", label: "Financeiro", icon: "lucide:wallet" },
  { href: "/produtor/participantes", label: "Participantes", icon: "lucide:users" },
  { href: "/produtor/cupons", label: "Cupons", icon: "lucide:ticket-percent" },
  { href: "/produtor/validar", label: "Validar ingresso", icon: "lucide:qr-code" },
  { href: "/produtor/checkin", label: "Check-in", icon: "lucide:clipboard-list" },
];

export default async function ProdutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName, user } = await requireAuth();
  return (
    <div className="eprd">
      <DashShell area="Área do produtor" items={NAV} userName={fullName ?? user!.email ?? "Produtor"}>
        {children}
      </DashShell>
    </div>
  );
}
