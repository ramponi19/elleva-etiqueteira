import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import OrdersAdmin, { type AdminOrder } from "@/components/app/orders-admin";

export const metadata: Metadata = { title: "Pedidos · Admin" };

const LIMITE = 1000;

export default async function AdminPedidos() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, buyer_name, buyer_email, buyer_cpf, total, status, payment_method, created_at, order_items(event_title, tier_name, quantity, unit_price)")
    .order("created_at", { ascending: false })
    .limit(LIMITE);

  const lista: AdminOrder[] = (orders ?? []).map((o) => ({
    id: o.id,
    buyer_name: o.buyer_name,
    buyer_email: o.buyer_email,
    buyer_cpf: (o.buyer_cpf as string | null) ?? null,
    total: Number(o.total),
    status: o.status,
    payment_method: o.payment_method,
    created_at: o.created_at,
    items: ((o.order_items ?? []) as { event_title: string; tier_name: string; quantity: number; unit_price: number }[])
      .map((i) => ({ event_title: i.event_title, tier_name: i.tier_name, quantity: i.quantity, unit_price: Number(i.unit_price) })),
  }));

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Pedidos</h1>
      <p className="corpo-suave mb-6 mt-1">Busque, filtre por situação, abra o detalhe de cada compra e exporte.</p>
      <OrdersAdmin orders={lista} truncated={lista.length >= LIMITE} />
    </div>
  );
}
