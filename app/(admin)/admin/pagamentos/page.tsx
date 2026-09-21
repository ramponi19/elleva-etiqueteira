import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { carregarPagamentos } from "@/lib/actions/payment-accounts";
import { ContasPagamento } from "@/components/elleva/contas-pagamento";

export const metadata: Metadata = { title: "Pagamentos · Admin" };

// Página de segredo: nada de cache. Se o Vercel servir uma versão estática
// disso, a máscara e o "valendo agora" ficam mentindo depois de uma troca.
export const dynamic = "force-dynamic";

export default async function AdminPagamentos() {
  // Layout NÃO protege página: no App Router as duas renderizam em paralelo,
  // então o redirect do layout não impede esta consulta de rodar (docs do Next:
  // "A layout also does not control whether the rest of the route renders").
  await requireRole(["admin"]);
  const estado = await carregarPagamentos();

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Instituição de pagamento</h1>
      <p className="corpo-suave mb-6 mt-1">
        Onde o dinheiro das vendas cai. Trocar de conta aqui vale na hora, sem mexer em código nem redeployar.
      </p>

      {"erro" in estado ? (
        <p className="corpo-suave">{estado.erro}</p>
      ) : (
        <ContasPagamento estado={estado} />
      )}
    </div>
  );
}
