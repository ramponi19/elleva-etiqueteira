"use client";

import { useState, useTransition } from "react";
import { cancelOrder } from "@/lib/actions/admin";
import { ConfirmDialog } from "@/components/ui/modal";

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
  const [open, setOpen] = useState(false);

  if (status === "refunded" || status === "cancelled" || done) {
    return <span className="rotulo text-tinta-60">—</span>;
  }

  const label = status === "paid" ? "Reembolsar" : "Cancelar";

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const res = await cancelOrder(orderId);
      setOpen(false);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Erro");
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="inline-flex min-h-[38px] items-center rounded-full border-[1.5px] border-tinta px-3 py-2 text-[12px] font-medium text-sol-escuro transition-colors hover:bg-papel-2 disabled:opacity-50"
      >
        {pending ? "..." : label}
      </button>
      {error && <span className="text-[12px] text-sol-escuro">{error}</span>}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirmar}
        title={`${label} pedido`}
        message={
          status === "paid"
            ? "O valor será estornado ao comprador e os ingressos deste pedido são cancelados. Esta ação não pode ser desfeita."
            : "O pedido será cancelado e os ingressos, invalidados. Esta ação não pode ser desfeita."
        }
        confirmLabel={label}
        danger
        pending={pending}
      />
    </span>
  );
}
