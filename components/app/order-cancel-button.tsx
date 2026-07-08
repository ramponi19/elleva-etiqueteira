"use client";

import { useState, useTransition } from "react";
import { cancelOrder } from "@/lib/actions/admin";

export default function OrderCancelButton({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "refunded" || status === "cancelled" || done) {
    return <span className="rotulo text-tinta-45">—</span>;
  }

  const label = status === "paid" ? "Reembolsar" : "Cancelar";

  function onClick() {
    if (!confirm(`${label} este pedido?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelOrder(orderId);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Erro");
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-full border-[1.5px] border-tinta px-3 py-1.5 text-[12px] font-medium text-sol-escuro transition-colors hover:bg-papel-2 disabled:opacity-50"
      >
        {pending ? "..." : label}
      </button>
      {error && <span className="text-[10px] text-sol-escuro">{error}</span>}
    </span>
  );
}
