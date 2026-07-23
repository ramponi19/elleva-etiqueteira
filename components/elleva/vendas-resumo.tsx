"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/shared/icon";
import { fmtBRL } from "@/lib/format";
import { lastNDays } from "@/lib/sales";
import { SalesBars } from "@/components/elleva/sales-bars";

export interface VendaRow {
  date: string;
  amount: number;
  qty: number;
  orderId: string;
}

const PERIODOS = [
  { dias: 7, label: "7 dias" },
  { dias: 14, label: "14 dias" },
  { dias: 30, label: "30 dias" },
  { dias: 90, label: "90 dias" },
];

export function VendasResumo({ rows }: { rows: VendaRow[] }) {
  const [dias, setDias] = useState(30);
  const [agora] = useState(() => Date.now()); // captura "agora" uma vez (puro no memo)

  const { receita, vendidos, pedidos, ticketMedio, serie } = useMemo(() => {
    const desde = agora - dias * 86400000;
    const noPeriodo = rows.filter((r) => {
      const t = new Date(r.date).getTime();
      return Number.isFinite(t) && t >= desde;
    });
    const receita = noPeriodo.reduce((a, r) => a + r.amount, 0);
    const vendidos = noPeriodo.reduce((a, r) => a + r.qty, 0);
    const pedidos = new Set(noPeriodo.map((r) => r.orderId)).size;
    return {
      receita,
      vendidos,
      pedidos,
      ticketMedio: pedidos ? receita / pedidos : 0,
      serie: lastNDays(noPeriodo.map((r) => ({ date: r.date, amount: r.amount })), dias),
    };
  }, [rows, dias, agora]);

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";
  const stats = [
    { label: "Receita (pagos)", value: fmtBRL(receita), icon: "lucide:wallet" },
    { label: "Ingressos vendidos", value: String(vendidos), icon: "lucide:ticket" },
    { label: "Pedidos pagos", value: String(pedidos), icon: "lucide:shopping-bag" },
    { label: "Ticket médio", value: fmtBRL(ticketMedio), icon: "lucide:trending-up" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.dias}
            type="button"
            onClick={() => setDias(p.dias)}
            aria-pressed={dias === p.dias}
            className={
              "inline-flex min-h-[38px] items-center rounded-[var(--radius-pill)] border-[1.5px] border-tinta px-3.5 text-[13px] font-medium transition-colors " +
              (dias === p.dias ? "bg-sol text-tinta" : "text-tinta hover:bg-papel-2")
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`${card} p-5`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-tinta text-sol">
              <Icon icon={s.icon} style={{ fontSize: 20 }} />
            </span>
            <p className="corpo-suave mt-3">{s.label}</p>
            <p className="numero mt-0.5 text-[22px] text-tinta sm:text-[24px]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className={`${card} mt-6 p-6`}>
        <h2 className="rotulo text-tinta-60">Receita — últimos {dias} dias</h2>
        <div className="mt-4">
          <SalesBars data={serie} />
        </div>
      </div>
    </div>
  );
}
