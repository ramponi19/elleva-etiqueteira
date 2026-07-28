import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import OrderCancelButton from "@/components/app/order-cancel-button";

export const metadata: Metadata = { title: "Pedidos · Admin" };

const TOM: Record<string, "sol" | "papel" | "tinta" | "cartaz"> = {
  paid: "sol",
  pending: "cartaz",
  cancelled: "tinta",
  refunded: "tinta",
};

export default async function AdminPedidos() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, buyer_name, buyer_email, total, status, payment_method, created_at")
    .order("created_at", { ascending: false })
    .limit(300); // limite explicito: sem isso o PostgREST cortava em 1000 sem avisar

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Pedidos</h1>
      <p className="corpo-suave mb-6 mt-1">{orders?.length ?? 0} pedido(s){(orders?.length ?? 0) >= 300 ? " — mostrando os 300 mais recentes" : ""}.</p>
      <div className={card}>
        {(orders ?? []).map((o, i) => (
          <div
            key={o.id}
            className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}
          >
            <div className="min-w-0">
              <p className="m-0 truncate text-[14px] font-medium text-tinta">{o.buyer_name}</p>
              <p className="corpo-suave m-0 truncate">{o.buyer_email} · {new Date(o.created_at).toLocaleString("pt-BR")}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Badge tom="papel">{o.payment_method}</Badge>
              <Badge tom={TOM[o.status] ?? "papel"}>{o.status}</Badge>
              <span className="numero min-w-[86px] text-right text-[15px] text-tinta">{fmtBRL(Number(o.total))}</span>
              <OrderCancelButton orderId={o.id} status={o.status} />
            </div>
          </div>
        ))}
        {!orders?.length && <p className="corpo-suave px-5 py-12 text-center">Nenhum pedido ainda.</p>}
      </div>
    </div>
  );
}
