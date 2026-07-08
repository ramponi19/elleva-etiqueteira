import type { Metadata } from "next";
import { EmBreve } from "@/components/elleva/em-breve";

export const metadata: Metadata = { title: "Vendas · Produtor" };

export default function ProdutorVendas() {
  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Vendas</h1>
      <p className="corpo-suave mb-6 mt-1">Acompanhe as vendas dos seus eventos.</p>
      <EmBreve icon="lucide:bar-chart-3" nota="Relatórios de vendas em breve." />
    </div>
  );
}
