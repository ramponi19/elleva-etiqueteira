"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { fmtBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { downloadCsv, csvNum, csvDate } from "@/lib/csv";
import OrderCancelButton from "@/components/app/order-cancel-button";

export interface AdminOrderItem {
  event_title: string;
  tier_name: string;
  quantity: number;
  unit_price: number;
}
export interface AdminOrder {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_cpf: string | null;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
  created_label: string; // já formatado no servidor (evita mismatch de hidratação)
  items: AdminOrderItem[];
}

// rótulos em português (as Badges mostravam o valor cru: "PAID", "CARD"). Mesmos
// termos dos filtros abaixo. Auditoria visual 2026-09-25.
const STATUS_LABEL: Record<string, string> = { paid: "Pago", pending: "Pendente", cancelled: "Cancelado", refunded: "Reembolsado" };
const METODO_LABEL: Record<string, string> = { pix: "Pix", card: "Cartão", free: "Grátis" };
const TOM: Record<string, "sol" | "papel" | "tinta" | "cartaz"> = {
  paid: "sol", pending: "cartaz", cancelled: "tinta", refunded: "tinta",
};
const STATUS = [
  { key: "todos", label: "Todos" },
  { key: "paid", label: "Pagos" },
  { key: "pending", label: "Pendentes" },
  { key: "refunded", label: "Reembolsados" },
  { key: "cancelled", label: "Cancelados" },
];

export default function OrdersAdmin({ orders, truncated }: { orders: AdminOrder[]; truncated: boolean }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "todos" && o.status !== status) return false;
      if (!t) return true;
      return (
        o.buyer_name?.toLowerCase().includes(t) ||
        o.buyer_email?.toLowerCase().includes(t) ||
        o.items.some((i) => i.event_title.toLowerCase().includes(t))
      );
    });
  }, [orders, q, status]);

  function exportCsv() {
    downloadCsv(
      "pedidos-elleva.csv",
      ["Data", "Comprador", "E-mail", "CPF", "Itens", "Método", "Status", "Total"],
      filtered.map((o) => [
        csvDate(o.created_at),
        o.buyer_name,
        o.buyer_email,
        o.buyer_cpf ?? "",
        o.items.map((i) => `${i.event_title} — ${i.tier_name} ×${i.quantity}`).join(" | "),
        o.payment_method,
        o.status,
        csvNum(o.total),
      ])
    );
  }

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";
  const total = filtered.reduce((a, o) => a + (o.status === "paid" ? o.total : 0), 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, e-mail ou evento…"
          className="min-w-[220px] flex-1 rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[14px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-[10px] border-[1.5px] border-tinta bg-white px-3 py-2.5 text-[14px] text-tinta outline-none focus:border-sol"
        >
          {STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!filtered.length}
          className="inline-flex min-h-[42px] items-center rounded-[10px] border-[1.5px] border-tinta px-4 text-[13px] font-medium text-tinta transition-colors hover:bg-papel-2 disabled:opacity-50"
        >
          Exportar CSV
        </button>
      </div>

      <p className="corpo-suave mb-3">
        {filtered.length} pedido(s){status === "todos" && !q ? "" : ` de ${orders.length}`} · pagos: {fmtBRL(total)}
        {truncated && " — mostrando os 1000 mais recentes"}
      </p>

      <div className={card}>
        {filtered.map((o, i) => (
          <div key={o.id} className={clsx(i && "border-t-[1.5px] border-dashed border-tinta")}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setOpenId(openId === o.id ? null : o.id)}
                // base 220px (era flex-1 = base 0): com base 0 a linha nunca quebrava,
                // o grupo da direita ocupava tudo e o nome/e-mail do cliente encolhia
                // a 0px no celular. Agora, sem espaço, o grupo desce pra linha de baixo.
                className="min-w-0 flex-[1_1_220px] text-left"
                aria-expanded={openId === o.id}
              >
                <p className="m-0 truncate text-[14px] font-medium text-tinta">{o.buyer_name}</p>
                <p className="corpo-suave m-0 truncate">{o.buyer_email} · {o.created_label}</p>
              </button>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Badge tom="papel">{METODO_LABEL[o.payment_method] ?? o.payment_method}</Badge>
                <Badge tom={TOM[o.status] ?? "papel"}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
                <span className="numero min-w-[86px] text-right text-[15px] text-tinta">{fmtBRL(o.total)}</span>
                <OrderCancelButton orderId={o.id} status={o.status} />
              </div>
            </div>
            {openId === o.id && (
              <div className="border-t-[1.5px] border-dashed border-tinta bg-papel-2 px-5 py-3">
                <p className="rotulo m-0 mb-1.5 text-tinta-60">Itens do pedido</p>
                {o.items.length ? (
                  <ul className="m-0 flex flex-col gap-1">
                    {o.items.map((it, k) => (
                      <li key={k} className="corpo-suave flex justify-between gap-3">
                        <span>{it.event_title} · {it.tier_name} × {it.quantity}</span>
                        <span className="numero text-tinta">{fmtBRL(it.unit_price * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="corpo-suave m-0">Sem itens.</p>}
                {o.buyer_cpf && <p className="corpo-suave m-0 mt-2">CPF: {o.buyer_cpf}</p>}
              </div>
            )}
          </div>
        ))}
        {!filtered.length && <p className="corpo-suave px-5 py-12 text-center">Nenhum pedido encontrado.</p>}
      </div>
    </div>
  );
}
