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
    return <span className="cat-pill" style={{ color: "var(--text-muted)" }}>—</span>;
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
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
      <button
        onClick={onClick}
        disabled={pending}
        style={{ background: "none", border: "1px solid var(--border)", borderRadius: 9999, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#d64545" }}
      >
        {pending ? "..." : label}
      </button>
      {error && <span style={{ fontSize: 10, color: "#d64545" }}>{error}</span>}
    </span>
  );
}
