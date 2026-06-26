import PageHeader from "@/components/app/page-header";
import ComingSoon from "@/components/app/coming-soon";

export default function ProdutorVendas() {
  return (
    <>
      <PageHeader title="Vendas" subtitle="Acompanhe as vendas dos seus eventos." />
      <main style={{ padding: 32 }}>
        <ComingSoon note="Relatórios de vendas em breve." />
      </main>
    </>
  );
}
