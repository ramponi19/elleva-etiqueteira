"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Barras } from "@/components/ui/barras";
import { Button } from "@/components/ui/button";
import { fmtBRL } from "@/lib/format";

// Confirmação de compra (spec 8.4 + §9): fundo tinta, "LUGAR GARANTIDO!",
// ingresso papel levemente rotacionado com o canhoto se rasgando (spring)
// depois de 400ms. Com prefers-reduced-motion vira crossfade simples.
export interface ItemConfirmado {
  eventTitle: string;
  tierName: string;
  qty: number;
}

export function ConfirmacaoRasgo({
  itens,
  total,
}: {
  itens: ItemConfirmado[];
  total: number;
}) {
  const reduzido = useReducedMotion();

  return (
    <div className="bg-tinta py-16 sm:py-20">
      <div className="mx-auto flex max-w-[520px] flex-col items-center px-5 text-center">
        <p className="rotulo m-0 text-cartaz">Pix aprovado</p>
        <h1 className="display-2 mt-3 text-papel">Lugar garantido!</h1>

        {/* O INGRESSO */}
        <motion.div
          className="mt-10 w-full max-w-[400px]"
          initial={reduzido ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={reduzido ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* arte do ingresso */}
          <div
            className="rounded-t-[var(--radius-card)] border-[1.5px] border-b-0 border-papel/20 bg-papel p-6 text-left"
            style={{ rotate: "-1.5deg" }}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rotulo text-sol-escuro">Elleva Tickets</span>
              <Barras />
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {itens.map((item, i) => (
                <div key={i}>
                  <p className="titulo-card m-0 text-tinta">{item.eventTitle}</p>
                  <p className="corpo-suave m-0 mt-1 text-tinta-60">
                    {item.tierName} × {item.qty}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CANHOTO — rasga 400ms depois */}
          <motion.div
            className="rounded-b-[var(--radius-card)] border-[1.5px] border-t-[1.5px] border-dashed border-papel/20 border-t-tinta-35 bg-papel px-6 py-4 text-left"
            style={{ rotate: "-1.5deg" }}
            initial={reduzido ? { opacity: 0 } : undefined}
            animate={
              reduzido
                ? { opacity: 1 }
                : { y: 14, rotate: 1, transition: { delay: 0.4, type: "spring", stiffness: 280, damping: 14 } }
            }
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="rotulo text-tinta-60">Total pago</span>
              <span className="numero text-[24px] text-tinta">{fmtBRL(total)}</span>
            </div>
            <p className="corpo-suave m-0 mt-1.5">
              Ingresso com QR code na sua conta e no seu e-mail.
            </p>
          </motion.div>
        </motion.div>

        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row">
          <Button href="/conta">Ver meus ingressos →</Button>
          <Button variante="contorno-papel" href="/agenda">
            Voltar pra agenda
          </Button>
        </div>
        <p className="corpo-suave m-0 mt-4 text-papel/60">
          Guarda o QR code: é ele que entra.
        </p>
      </div>
    </div>
  );
}
