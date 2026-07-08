import { requireRole } from "@/lib/auth";
import { ProducerShell } from "@/components/elleva/producer-shell";

export default async function ProdutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName, user } = await requireRole(["producer", "admin"]);
  return (
    <ProducerShell userName={fullName ?? user!.email ?? "Produtor"}>
      {children}
    </ProducerShell>
  );
}
