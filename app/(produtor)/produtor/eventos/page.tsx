import PageHeader from "@/components/app/page-header";
import ComingSoon from "@/components/app/coming-soon";

export default function ProdutorEventos() {
  return (
    <>
      <PageHeader title="Meus eventos" subtitle="Crie e gerencie seus eventos." />
      <main style={{ padding: 32 }}>
        <ComingSoon note="Criação e edição de eventos em breve." />
      </main>
    </>
  );
}
