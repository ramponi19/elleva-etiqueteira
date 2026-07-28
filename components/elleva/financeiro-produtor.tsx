"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { PayoutAccountForm, type PayoutData } from "@/components/elleva/payout-account-form";
import { requestPayout } from "@/lib/actions/payouts";
import { fmtBRL } from "@/lib/format";
import type { ProducerFinance, EventoFin } from "@/lib/finance";

export interface PayoutView {
  amount: number;
  status: string;
  method: string | null;
  reference: string | null;
  note: string | null;
  created_at: string;
  paid_at: string | null;
  rejected_reason: string | null;
}

const STATUS: Record<string, { label: string; tom: "sol" | "papel" | "tinta" }> = {
  requested: { label: "Em análise", tom: "papel" },
  paid: { label: "Pago", tom: "sol" },
  rejected: { label: "Não aprovado", tom: "tinta" },
};

const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

export function FinanceiroProdutor({
  fin,
  payouts,
  conta,
  temPix,
}: {
  fin: ProducerFinance;
  payouts: PayoutView[];
  conta: PayoutData;
  temPix: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [evento, setEvento] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const eventosFiltrados = useMemo(
    () => (evento ? fin.eventos.filter((e) => e.eventId === evento) : fin.eventos),
    [fin.eventos, evento]
  );

  function solicitar() {
    setErr(null); setMsg(null);
    start(async () => {
      const r = await requestPayout();
      setConfirmOpen(false);
      if (!r.ok) return setErr(r.error ?? "Não foi possível solicitar.");
      setMsg(`Repasse de ${fmtBRL(r.amount ?? 0)} solicitado! A Elleva processa e paga na sua chave Pix.`);
      router.refresh();
    });
  }

  const stat = (icon: string, label: string, value: string, tone: string, sub?: string) => (
    <div className={`${card} p-5`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-tinta ${tone}`}>
        <Icon icon={icon} style={{ fontSize: 20 }} />
      </span>
      <p className="corpo-suave mt-3">{label}</p>
      <p className="numero mt-0.5 text-[24px] text-tinta">{value}</p>
      {sub && <p className="corpo-suave mt-1 text-[12px]">{sub}</p>}
    </div>
  );

  const inputCls = "rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[16px] text-tinta outline-none focus:border-sol";

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat("lucide:wallet", "Disponível para saque", fmtBRL(fin.disponivel), "text-sol", "de eventos já realizados")}
        {stat("lucide:hourglass", "A liberar", fmtBRL(fin.aLiberar), "text-tinta-60", `libera ~2 dias após o evento`)}
        {stat("lucide:clock", "Em análise", fmtBRL(fin.solicitado), "text-tinta-60", "repasse solicitado")}
        {stat("lucide:check-check", "Já repassado", fmtBRL(fin.repassado), "text-palco")}
      </div>

      {/* Solicitar repasse */}
      <div className={`${card} mt-6 flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div>
          <p className="m-0 text-[15px] font-medium text-tinta">Solicitar repasse</p>
          <p className="corpo-suave m-0 mt-0.5">
            {temPix
              ? <>Você pode sacar <strong className="text-tinta">{fmtBRL(fin.disponivel)}</strong> agora. Cai na sua chave Pix após a Elleva processar.</>
              : "Cadastre sua chave Pix abaixo para poder solicitar o repasse."}
          </p>
        </div>
        <Button
          variante="primario"
          disabled={pending || !temPix || fin.disponivel <= 0}
          onClick={() => setConfirmOpen(true)}
        >
          {pending ? "..." : "Solicitar repasse"}
        </Button>
      </div>
      {msg && <p className="mt-3 rounded-[10px] border-[1.5px] border-palco bg-papel-2 px-4 py-2.5 text-[13.5px] text-palco">{msg}</p>}
      {err && <p className="mt-3 rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-4 py-2.5 text-[13.5px] text-sol-escuro">{err}</p>}

      {/* Extrato por evento */}
      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-extrabold text-tinta">Extrato por evento</h2>
        <select className={inputCls} value={evento} onChange={(e) => setEvento(e.target.value)}>
          <option value="">Todos os eventos</option>
          {fin.eventos.map((e) => <option key={e.eventId} value={e.eventId}>{e.title}</option>)}
        </select>
      </div>
      <div className={card}>
        {eventosFiltrados.length === 0 ? (
          <p className="corpo-suave px-5 py-12 text-center">Nenhuma venda ainda. Seu saldo aparece aqui conforme os ingressos são pagos.</p>
        ) : (
          eventosFiltrados.map((e: EventoFin, i) => (
            <div key={e.eventId} className={`px-5 py-4 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-[15px] font-medium text-tinta">{e.title}</p>
                <span className="numero text-[16px] text-tinta">{fmtBRL(e.liquido)}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-tinta-60">
                <span>{e.vendidos} vendido(s) · bruto {fmtBRL(e.bruto)}</span>
                {e.cupom > 0 && <span>cupom −{fmtBRL(e.cupom)}</span>}
                <span>taxa Elleva {fmtBRL(e.taxa)}</span>
                <Badge tom={e.liberado ? "sol" : "papel"}>{e.liberado ? "Liberado" : "A liberar"}</Badge>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="corpo-suave mt-3 text-[12px]">
        Líquido = valor de face dos ingressos pagos (menos cupons seus). A taxa de serviço é da Elleva (paga pelo comprador, por cima) e não entra no seu saldo.
      </p>

      {/* Conta Pix */}
      <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Conta de recebimento (Pix)</h2>
      <div className={`${card} p-6`}>
        <PayoutAccountForm initial={conta} />
      </div>

      {/* Histórico de repasses */}
      <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Histórico de repasses</h2>
      <div className={card}>
        {payouts.length === 0 ? (
          <p className="corpo-suave px-5 py-12 text-center">Nenhum repasse ainda.</p>
        ) : (
          payouts.map((p, i) => {
            const s = STATUS[p.status] ?? { label: p.status, tom: "papel" as const };
            return (
              <div key={i} className={`flex items-center justify-between gap-3 px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
                <div className="min-w-0">
                  <p className="m-0 text-[14px] font-medium text-tinta">
                    {p.status === "paid" ? "Repasse pago" : p.status === "requested" ? "Repasse solicitado" : "Repasse não aprovado"}
                  </p>
                  <p className="corpo-suave m-0">
                    {new Date(p.paid_at ?? p.created_at).toLocaleDateString("pt-BR")}
                    {p.reference ? ` · ${p.reference}` : ""}
                    {p.rejected_reason ? ` · ${p.rejected_reason}` : ""}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <Badge tom={s.tom}>{s.label}</Badge>
                  <span className="numero text-[15px] text-tinta">{fmtBRL(Number(p.amount))}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={solicitar}
        title="Solicitar repasse"
        message={<>Solicitar o repasse de <strong>{fmtBRL(fin.disponivel)}</strong> para sua chave Pix? A Elleva confere e paga.</>}
        confirmLabel="Solicitar"
        pending={pending}
      />
    </div>
  );
}
