"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { PayoutAccountForm, type PayoutData } from "@/components/elleva/payout-account-form";
import { requestPayout, requestAdvance, getReceiptUrl } from "@/lib/actions/payouts";
import { fmtBRL } from "@/lib/format";
import { downloadCsv, csvNum, csvDate } from "@/lib/csv";
import type { ProducerFinance } from "@/lib/finance";

export interface PayoutView {
  id: string;
  amount: number;
  net_amount: number | null;
  fee_amount: number | null;
  fee_pct: number | null;
  kind: string;
  status: string;
  method: string | null;
  reference: string | null;
  receipt_path: string | null;
  created_at: string;
  paid_at: string | null;
  rejected_reason: string | null;
}

const STATUS: Record<string, { label: string; tom: "sol" | "papel" | "tinta" }> = {
  requested: { label: "Em análise", tom: "papel" },
  paid: { label: "Pago", tom: "sol" },
  rejected: { label: "Não aprovado", tom: "tinta" },
};

const PERIODOS = [
  { d: 0, label: "Tudo" },
  { d: 30, label: "30 dias" },
  { d: 90, label: "90 dias" },
  { d: 365, label: "12 meses" },
];

const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

export function FinanceiroProdutor({
  fin,
  payouts,
  conta,
}: {
  fin: ProducerFinance;
  payouts: PayoutView[];
  conta: PayoutData;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [evento, setEvento] = useState("");
  const [dias, setDias] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [askSaque, setAskSaque] = useState(false);
  const [askAntecipa, setAskAntecipa] = useState(false);
  const [agora] = useState(() => Date.now());

  const temPix = !!fin.pixKey;
  const feeAntecip = Math.round(fin.antecipavel * fin.advanceFeePct) / 100;
  const netAntecip = Math.round((fin.antecipavel - feeAntecip) * 100) / 100;

  const eventos = useMemo(() => {
    const desde = dias ? agora - dias * 86400000 : 0;
    return fin.eventos.filter(
      (e) =>
        (!evento || e.eventId === evento) &&
        (!desde || (e.startsAt ? new Date(e.startsAt).getTime() >= desde : true))
    );
  }, [fin.eventos, evento, dias, agora]);

  function acao(fn: () => Promise<{ ok: boolean; error?: string; amount?: number }>, sucesso: (v: number) => string, fecha: () => void) {
    setErr(null); setMsg(null);
    start(async () => {
      const r = await fn();
      fecha();
      if (!r.ok) return setErr(r.error ?? "Não foi possível concluir.");
      setMsg(sucesso(r.amount ?? 0));
      router.refresh();
    });
  }

  function verComprovante(id: string) {
    setErr(null);
    start(async () => {
      const r = await getReceiptUrl(id);
      if (!r.ok) return setErr(r.error);
      if (r.url) window.open(r.url, "_blank", "noopener");
    });
  }

  function exportar() {
    downloadCsv(
      `extrato-elleva-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Evento", "Data", "Vendidos", "Bruto", "Cupom", "Liquido", "Taxa Elleva", "Situacao"],
      eventos.map((e) => [
        e.title, csvDate(e.startsAt), e.vendidos, csvNum(e.bruto), csvNum(e.cupom),
        csvNum(e.liquido), csvNum(e.taxa), e.liberado ? "Liberado" : "A liberar",
      ])
    );
  }

  const stat = (icon: string, label: string, value: string, tone: string, sub?: React.ReactNode) => (
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
  const pill = (ativo: boolean) =>
    "inline-flex min-h-[38px] items-center rounded-[var(--radius-pill)] border-[1.5px] border-tinta px-3.5 text-[13px] font-medium transition-colors " +
    (ativo ? "bg-sol text-tinta" : "text-tinta hover:bg-papel-2");

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat("lucide:wallet", "Disponível para saque", fmtBRL(fin.disponivel), "text-sol", "de eventos já realizados")}
        {stat("lucide:hourglass", "A liberar", fmtBRL(fin.aLiberar), "text-tinta-60",
          fin.jaAntecipado > 0
            ? <>já antecipado: {fmtBRL(fin.jaAntecipado)}</>
            : fin.advanceEnabled && fin.antecipavel > 0
              ? <>pode antecipar {fmtBRL(fin.antecipavel)}</>
              : <>libera ~2 dias após o evento</>)}
        {stat("lucide:clock", "Em análise", fmtBRL(fin.solicitado), "text-tinta-60", "aguardando a Elleva")}
        {stat("lucide:check-check", "Já repassado", fmtBRL(fin.repassado), "text-palco")}
      </div>

      {/* Saque normal */}
      <div className={`${card} mt-6 flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="min-w-0">
          <p className="m-0 text-[15px] font-medium text-tinta">Solicitar repasse</p>
          <p className="corpo-suave m-0 mt-0.5">
            {!temPix
              ? "Cadastre sua chave Pix abaixo para poder solicitar."
              : fin.disponivel > 0
                ? <>Saque <strong className="text-tinta">{fmtBRL(fin.disponivel)}</strong> — cai na sua chave Pix depois que a Elleva confirma.</>
                : "Sem saldo liberado agora. O valor libera após o evento."}
          </p>
        </div>
        <Button variante="primario" disabled={pending || !temPix || fin.disponivel <= 0} onClick={() => setAskSaque(true)}>
          Solicitar repasse
        </Button>
      </div>

      {/* Antecipação */}
      {fin.advanceEnabled && (
        <div className={`${card} mt-4 flex flex-wrap items-center justify-between gap-4 border-sol p-5`}>
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-2 text-[15px] font-medium text-tinta">
              <Icon icon="lucide:zap" style={{ fontSize: 18, color: "var(--color-sol-escuro)" }} />
              Antecipar recebimento
            </p>
            {!temPix ? (
              <p className="corpo-suave m-0 mt-0.5">Cadastre sua chave Pix abaixo para poder antecipar.</p>
            ) : fin.antecipavel > 0 ? (
              <p className="corpo-suave m-0 mt-0.5">
                Receba <strong className="text-tinta">{fmtBRL(netAntecip)}</strong> agora, sem esperar o evento —
                antecipando {fmtBRL(fin.antecipavel)} com taxa de {fin.advanceFeePct}% ({fmtBRL(feeAntecip)}).
              </p>
            ) : (
              <p className="corpo-suave m-0 mt-0.5">Nada retido para antecipar no momento.</p>
            )}
          </div>
          <Button variante="tinta" disabled={pending || !temPix || fin.antecipavel <= 0} onClick={() => setAskAntecipa(true)}>
            Antecipar
          </Button>
        </div>
      )}

      {msg && <p className="mt-3 rounded-[10px] border-[1.5px] border-palco bg-papel-2 px-4 py-2.5 text-[13.5px] text-palco">{msg}</p>}
      {err && <p className="mt-3 rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-4 py-2.5 text-[13.5px] text-sol-escuro">{err}</p>}

      {/* Extrato por evento */}
      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-extrabold text-tinta">Extrato por evento</h2>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODOS.map((p) => (
            <button key={p.d} type="button" onClick={() => setDias(p.d)} aria-pressed={dias === p.d} className={pill(dias === p.d)}>
              {p.label}
            </button>
          ))}
          <select className={inputCls} value={evento} onChange={(e) => setEvento(e.target.value)}>
            <option value="">Todos os eventos</option>
            {fin.eventos.map((e) => <option key={e.eventId} value={e.eventId}>{e.title}</option>)}
          </select>
          <Button variante="contorno" type="button" onClick={exportar} disabled={!eventos.length}>
            <Icon icon="lucide:download" style={{ fontSize: 16 }} /> CSV
          </Button>
        </div>
      </div>
      <div className={card}>
        {eventos.length === 0 ? (
          <p className="corpo-suave px-5 py-12 text-center">Nenhuma venda no período. Seu saldo aparece aqui conforme os ingressos são pagos.</p>
        ) : (
          eventos.map((e, i) => (
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
        Líquido = face dos ingressos pagos (menos seus cupons). A taxa de serviço é da Elleva — paga pelo comprador, por cima — e não entra no seu saldo.
      </p>

      {/* Lançamentos (ajustes) */}
      {fin.ajustes.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Lançamentos</h2>
          <div className={card}>
            {fin.ajustes.map((a, i) => (
              <div key={a.id} className={`flex items-center justify-between gap-3 px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
                <div className="min-w-0">
                  <p className="m-0 text-[14px] font-medium text-tinta">{a.reason}</p>
                  <p className="corpo-suave m-0">{new Date(a.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <span className={`numero text-[15px] ${a.kind === "credit" ? "text-palco" : "text-sol-escuro"}`}>
                  {a.kind === "credit" ? "+" : "−"} {fmtBRL(a.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Conta Pix */}
      <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Conta de recebimento (Pix)</h2>
      <div className={`${card} p-6`}>
        <PayoutAccountForm initial={conta} />
      </div>

      {/* Histórico */}
      <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Histórico de repasses</h2>
      <div className={card}>
        {payouts.length === 0 ? (
          <p className="corpo-suave px-5 py-12 text-center">Nenhum repasse ainda.</p>
        ) : (
          payouts.map((p, i) => {
            const s = STATUS[p.status] ?? { label: p.status, tom: "papel" as const };
            const net = Number(p.net_amount ?? p.amount);
            const fee = Number(p.fee_amount ?? 0);
            return (
              <div key={p.id} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
                <div className="min-w-0">
                  <p className="m-0 flex items-center gap-2 text-[14px] font-medium text-tinta">
                    {p.kind === "advance" && <Icon icon="lucide:zap" style={{ fontSize: 15, color: "var(--color-sol-escuro)" }} />}
                    {p.kind === "advance" ? "Antecipação" : "Repasse"}
                  </p>
                  <p className="corpo-suave m-0">
                    {new Date(p.paid_at ?? p.created_at).toLocaleDateString("pt-BR")}
                    {fee > 0 ? ` · taxa ${fmtBRL(fee)}` : ""}
                    {p.reference ? ` · ${p.reference}` : ""}
                    {p.rejected_reason ? ` · ${p.rejected_reason}` : ""}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  {p.receipt_path && (
                    <button type="button" onClick={() => verComprovante(p.id)} disabled={pending}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[var(--radius-pill)] border-[1.5px] border-tinta px-3 text-[12px] font-medium text-tinta hover:bg-papel-2 disabled:opacity-50">
                      <Icon icon="lucide:receipt" style={{ fontSize: 15 }} /> comprovante
                    </button>
                  )}
                  <Badge tom={s.tom}>{s.label}</Badge>
                  <span className="numero text-[15px] text-tinta">{fmtBRL(net)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={askSaque}
        onClose={() => setAskSaque(false)}
        onConfirm={() => acao(requestPayout, (v) => `Repasse de ${fmtBRL(v)} solicitado! A Elleva processa e paga na sua chave Pix.`, () => setAskSaque(false))}
        title="Solicitar repasse"
        message={<>Solicitar <strong>{fmtBRL(fin.disponivel)}</strong> para a chave Pix <strong>{fin.pixKey}</strong>?</>}
        confirmLabel="Solicitar"
        pending={pending}
      />
      <ConfirmDialog
        open={askAntecipa}
        onClose={() => setAskAntecipa(false)}
        onConfirm={() => acao(() => requestAdvance(), (v) => `Antecipação solicitada! Você recebe ${fmtBRL(v)} após a Elleva confirmar.`, () => setAskAntecipa(false))}
        title="Antecipar recebimento"
        message={
          <>
            Antecipar <strong>{fmtBRL(fin.antecipavel)}</strong> com taxa de {fin.advanceFeePct}% (<strong>{fmtBRL(feeAntecip)}</strong>)?
            <br />Você recebe <strong>{fmtBRL(netAntecip)}</strong> na chave Pix, sem esperar o evento.
          </>
        }
        confirmLabel="Antecipar"
        pending={pending}
      />
    </div>
  );
}
