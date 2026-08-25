"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/modal";
import { cancelEvent, type CancelResumo } from "@/lib/actions/events";

/** Zona de perigo: cancela o evento e reembolsa todo mundo em lote.
 *  Aparece pro dono e pro admin, na tela de edição do evento. */
export default function CancelEventButton({
  eventId,
  title,
  status,
}: {
  eventId: string;
  title: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resumo, setResumo] = useState<CancelResumo | null>(null);

  if (status === "cancelled") {
    return (
      <div className="rounded-[var(--radius-card)] border-[1.5px] border-dashed border-tinta/40 bg-papel-2 px-5 py-4">
        <p className="corpo-suave m-0">Este evento está <strong className="text-tinta">cancelado</strong>. As compras estão bloqueadas e o saldo fica retido para reembolso.</p>
      </div>
    );
  }

  function doCancel() {
    setError(null);
    startTransition(async () => {
      const res = await cancelEvent(eventId);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível cancelar o evento.");
        return;
      }
      setOpen(false);
      setResumo(res.resumo ?? null);
      router.refresh();
    });
  }

  if (resumo) {
    return (
      <div className="rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-papel-2 px-5 py-4">
        <p className="m-0 text-[15px] font-medium text-tinta">Evento cancelado.</p>
        <ul className="corpo-suave m-0 mt-2 flex flex-col gap-0.5">
          <li>{resumo.reembolsados} pedido(s) pago(s) reembolsado(s)</li>
          <li>{resumo.pendentesCancelados} pedido(s) pendente(s) cancelado(s)</li>
          {resumo.falhas > 0 && (
            <li className="text-sol-escuro">
              {resumo.falhas} estorno(s) falharam no provedor — clique em cancelar de novo para retentar só os que faltam.
            </li>
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border-[1.5px] border-sol/50 bg-[rgb(232_72_31/0.05)] px-5 py-4">
      <h3 className="m-0 text-[14px] font-extrabold uppercase tracking-wide text-sol-escuro">Cancelar evento</h3>
      <p className="corpo-suave m-0 mt-1 max-w-[62ch]">
        Cancela o evento e <strong>reembolsa automaticamente todos os compradores</strong>. As vendas param na hora e o
        ingresso deixa de valer. Não dá para desfazer.
      </p>
      {error && <p className="corpo-suave m-0 mt-2 text-sol-escuro">{error}</p>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="mt-3 inline-flex min-h-[44px] items-center rounded-[var(--radius-pill)] border-[1.5px] border-sol bg-sol px-5 text-[14px] font-bold text-papel transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Cancelando…" : "Cancelar evento e reembolsar"}
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={doCancel}
        title="Cancelar evento"
        message={
          <>
            Cancelar <strong>“{title}”</strong> e reembolsar todos os compradores? As vendas param imediatamente, os
            ingressos são invalidados e o valor volta para cada comprador. <strong>Esta ação não pode ser desfeita.</strong>
          </>
        }
        confirmLabel="Cancelar e reembolsar"
        danger
        pending={pending}
      />
    </div>
  );
}
