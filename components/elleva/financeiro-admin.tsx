"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import {
  markPayoutPaid, rejectPayout, adminPayoutProducer,
  createAdjustment, deleteAdjustment, setAdvanceSettings, getReceiptUrl,
} from "@/lib/actions/payouts";
import { fmtBRL } from "@/lib/format";
import { downloadCsv, csvNum, csvDate } from "@/lib/csv";
import type { PlatformFinance, ProducerFinance } from "@/lib/finance";

export interface RequestRow {
  id: string;
  producerId: string;
  producer: string;
  pixKey: string | null;
  kind: string;
  amount: number;
  fee: number;
  net: number;
  created_at: string;
}
export interface LedgerRow {
  id: string;
  data: string;
  produtor: string;
  tipo: string;      // Repasse | Antecipação | Crédito | Débito
  status: string;    // Pago | Em análise | Não aprovado | Lançamento
  valor: number;     // assinado (negativo = saiu do saldo do produtor)
  taxa: number;
  referencia: string;
  receiptPath: string | null;
  isPayout: boolean;
}

const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";
const inputCls = "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";
const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-tinta-60";
const miniBtn = "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border-[1.5px] border-tinta px-3 text-[12px] font-medium text-tinta hover:bg-papel-2 disabled:opacity-45 disabled:cursor-not-allowed";

export function FinanceiroAdmin({
  plat,
  requests,
  ledger,
}: {
  plat: PlatformFinance;
  requests: RequestRow[];
  ledger: LedgerRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroLedger, setFiltroLedger] = useState("");

  // modais
  const [pagar, setPagar] = useState<{ payoutId?: string; producerId?: string; label: string; valor: number } | null>(null);
  const [segurar, setSegurar] = useState<{ id: string; label: string } | null>(null);
  const [lanc, setLanc] = useState<ProducerFinance | null>(null);
  const [antec, setAntec] = useState<ProducerFinance | null>(null);
  const [delAjuste, setDelAjuste] = useState<{ id: string; label: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, fecha: () => void, sucesso?: string) => {
    setErr(null); setMsg(null);
    start(async () => {
      const r = await fn();
      fecha();
      if (!r.ok) return setErr(r.error ?? "Erro.");
      if (sucesso) setMsg(sucesso);
      router.refresh();
    });
  };

  function verComprovante(payoutId: string) {
    setErr(null);
    start(async () => {
      const r = await getReceiptUrl(payoutId);
      if (!r.ok) return setErr(r.error);
      if (r.url) window.open(r.url, "_blank", "noopener");
    });
  }

  const produtores = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return t ? plat.produtores.filter((p) => p.nome.toLowerCase().includes(t) || (p.pixKey ?? "").toLowerCase().includes(t)) : plat.produtores;
  }, [plat.produtores, busca]);

  const ledgerFiltrado = useMemo(() => {
    const t = filtroLedger.trim().toLowerCase();
    return t ? ledger.filter((l) => (l.produtor + l.tipo + l.status + l.referencia).toLowerCase().includes(t)) : ledger;
  }, [ledger, filtroLedger]);

  function exportarLedger() {
    downloadCsv(
      `financeiro-elleva-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Data", "Produtor", "Tipo", "Situacao", "Valor", "Taxa", "Referencia"],
      ledgerFiltrado.map((l) => [csvDate(l.data), l.produtor, l.tipo, l.status, csvNum(l.valor), csvNum(l.taxa), l.referencia])
    );
  }
  function exportarProdutores() {
    downloadCsv(
      `saldos-produtores-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Produtor", "Chave Pix", "Liquido", "Disponivel", "Retido", "Em analise", "Repassado", "Antecipacao", "Taxa antec (%)"],
      produtores.map((p) => [
        p.nome, p.pixKey ?? "", csvNum(p.liquido), csvNum(p.disponivel), csvNum(p.aLiberar),
        csvNum(p.solicitado), csvNum(p.repassado), p.advanceEnabled ? "habilitada" : "não", csvNum(p.advanceFeePct),
      ])
    );
  }

  const stat = (icon: string, label: string, value: string, tone: string, sub?: string) => (
    <div className={`${card} p-5`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-tinta ${tone}`}>
        <Icon icon={icon} style={{ fontSize: 20 }} />
      </span>
      <p className="corpo-suave mt-3">{label}</p>
      <p className="numero mt-0.5 text-[22px] text-tinta">{value}</p>
      {sub && <p className="corpo-suave mt-1 text-[12px]">{sub}</p>}
    </div>
  );

  return (
    <div>
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat("lucide:trending-up", "Receita da Elleva", fmtBRL(plat.receitaTotal), "text-sol", `taxa ${fmtBRL(plat.taxaTotal)} + antecipação ${fmtBRL(plat.antecipacaoTotal)}`)}
        {stat("lucide:bar-chart-3", "GMV (vendido)", fmtBRL(plat.gmv), "text-tinta-60", "valor de face")}
        {stat("lucide:hand-coins", "A pagar agora", fmtBRL(plat.aPagarTotal), "text-tinta", "saldo liberado dos produtores")}
        {stat("lucide:vault", "Retido", fmtBRL(plat.retidoTotal), "text-tinta-60", "libera após os eventos")}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat("lucide:clock", "Solicitações pendentes", fmtBRL(plat.pendentesTotal), "text-tinta-60", `${requests.length} na fila`)}
        {stat("lucide:check-check", "Já repassado", fmtBRL(plat.repassadoTotal), "text-palco")}
        {stat("lucide:users", "Produtores com saldo", String(plat.produtores.filter((p) => p.disponivel > 0).length), "text-tinta-60", `de ${plat.produtores.length} com vendas`)}
        {stat("lucide:landmark", "Líquido dos produtores", fmtBRL(plat.liquidoTotal), "text-tinta-60", "total gerado (menos cupons)")}
      </div>

      {msg && <p className="mt-4 rounded-[10px] border-[1.5px] border-palco bg-papel-2 px-4 py-2.5 text-[13.5px] text-palco">{msg}</p>}
      {err && <p className="mt-4 rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-4 py-2.5 text-[13.5px] text-sol-escuro">{err}</p>}

      {/* FILA */}
      <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Solicitações de repasse</h2>
      <div className={card}>
        {requests.length === 0 ? (
          <p className="corpo-suave px-5 py-12 text-center">Nenhuma solicitação pendente.</p>
        ) : (
          requests.map((r, i) => (
            <div key={r.id} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
              <div className="min-w-0">
                <p className="m-0 flex items-center gap-2 text-[15px] font-medium text-tinta">
                  {r.kind === "advance" && <Icon icon="lucide:zap" style={{ fontSize: 15, color: "var(--color-sol-escuro)" }} />}
                  {r.producer}
                  {r.kind === "advance" && <Badge tom="cartaz">Antecipação</Badge>}
                </p>
                <p className="corpo-suave m-0">
                  Pix: <span className="font-mono">{r.pixKey || "— sem chave —"}</span> · {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  {r.fee > 0 ? ` · taxa ${fmtBRL(r.fee)}` : ""}
                </p>
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
                <span className="text-right">
                  <span className="numero block text-[16px] text-tinta">{fmtBRL(r.net)}</span>
                  {r.fee > 0 && <span className="corpo-suave block text-[11px]">de {fmtBRL(r.amount)}</span>}
                </span>
                <Button variante="tinta" disabled={pending} onClick={() => setPagar({ payoutId: r.id, label: `${r.producer} · ${fmtBRL(r.net)}`, valor: r.net })}>
                  Marcar pago
                </Button>
                <button type="button" className={miniBtn} disabled={pending} onClick={() => setSegurar({ id: r.id, label: r.producer })}>
                  segurar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PRODUTORES */}
      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-extrabold text-tinta">Saldo por produtor</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${inputCls} min-w-[200px]`} placeholder="Buscar produtor ou chave Pix" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <Button variante="contorno" type="button" onClick={exportarProdutores} disabled={!produtores.length}>
            <Icon icon="lucide:download" style={{ fontSize: 16 }} /> CSV
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className={`${card} min-w-[900px]`}>
          <div className="flex items-center gap-3 bg-papel-2 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-tinta-60">
            <span className="flex-1">Produtor</span>
            <span className="w-24 text-right">Líquido</span>
            <span className="w-24 text-right">Disponível</span>
            <span className="w-24 text-right">Retido</span>
            <span className="w-24 text-right">Em análise</span>
            <span className="w-24 text-right">Repassado</span>
            <span className="w-[260px] text-right">Ações</span>
          </div>
          {produtores.length === 0 ? (
            <p className="corpo-suave px-5 py-12 text-center">Nenhum produtor encontrado.</p>
          ) : (
            produtores.map((p, i) => (
              <div key={p.producerId} className={`flex items-center gap-3 px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-tinta">{p.nome}</span>
                  <span className="block truncate font-mono text-[11px] text-tinta-60">{p.pixKey || "sem chave Pix"}</span>
                </span>
                <span className="numero w-24 text-right text-[14px] text-tinta-60">{fmtBRL(p.liquido)}</span>
                <span className="numero w-24 text-right text-[14px] font-semibold text-tinta">{fmtBRL(p.disponivel)}</span>
                <span className="numero w-24 text-right text-[14px] text-tinta-60">{fmtBRL(p.aLiberar)}</span>
                <span className="numero w-24 text-right text-[14px] text-tinta-60">{fmtBRL(p.solicitado)}</span>
                <span className="numero w-24 text-right text-[14px] text-tinta-60">{fmtBRL(p.repassado)}</span>
                <span className="flex w-[260px] flex-wrap justify-end gap-2">
                  <button type="button" className={miniBtn} disabled={pending || p.disponivel <= 0}
                    onClick={() => setPagar({ producerId: p.producerId, label: `${p.nome} · ${fmtBRL(p.disponivel)}`, valor: p.disponivel })}>
                    <Icon icon="lucide:send" style={{ fontSize: 14 }} /> Repassar
                  </button>
                  <button type="button" className={miniBtn} disabled={pending} onClick={() => setLanc(p)}>
                    <Icon icon="lucide:calculator" style={{ fontSize: 14 }} /> Lançar
                  </button>
                  <button type="button" className={miniBtn} disabled={pending} onClick={() => setAntec(p)}>
                    <Icon icon="lucide:zap" style={{ fontSize: 14 }} /> {p.advanceEnabled ? `${p.advanceFeePct}%` : "antec."}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EXTRATO GERAL */}
      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-extrabold text-tinta">Extrato geral</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${inputCls} min-w-[200px]`} placeholder="Buscar no extrato" value={filtroLedger} onChange={(e) => setFiltroLedger(e.target.value)} />
          <Button variante="contorno" type="button" onClick={exportarLedger} disabled={!ledgerFiltrado.length}>
            <Icon icon="lucide:download" style={{ fontSize: 16 }} /> CSV
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className={`${card} min-w-[820px]`}>
          <div className="flex items-center gap-3 bg-papel-2 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-tinta-60">
            <span className="w-24">Data</span>
            <span className="flex-1">Produtor</span>
            <span className="w-28">Tipo</span>
            <span className="w-28">Situação</span>
            <span className="w-24 text-right">Valor</span>
            <span className="w-24 text-right">Taxa</span>
            <span className="w-32 text-right">Comprovante</span>
          </div>
          {ledgerFiltrado.length === 0 ? (
            <p className="corpo-suave px-5 py-12 text-center">Nenhum lançamento.</p>
          ) : (
            ledgerFiltrado.map((l, i) => (
              <div key={l.id} className={`flex items-center gap-3 px-5 py-3 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
                <span className="w-24 text-[13px] text-tinta-60">{csvDate(l.data)}</span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-tinta">{l.produtor}</span>
                <span className="w-28 text-[13px] text-tinta-60">{l.tipo}</span>
                <span className="w-28"><Badge tom={l.status === "Pago" ? "sol" : l.status === "Em análise" ? "papel" : l.status === "Lançamento" ? "cartaz" : "tinta"}>{l.status}</Badge></span>
                <span className={`numero w-24 text-right text-[13.5px] ${l.valor < 0 ? "text-sol-escuro" : "text-palco"}`}>{l.valor < 0 ? "−" : "+"} {fmtBRL(Math.abs(l.valor))}</span>
                <span className="numero w-24 text-right text-[13px] text-tinta-60">{l.taxa > 0 ? fmtBRL(l.taxa) : "—"}</span>
                <span className="w-32 text-right">
                  {l.receiptPath ? (
                    <button type="button" className={miniBtn} disabled={pending} onClick={() => verComprovante(l.id)}>
                      <Icon icon="lucide:receipt" style={{ fontSize: 14 }} /> ver
                    </button>
                  ) : !l.isPayout ? (
                    <button type="button" className={miniBtn} disabled={pending} onClick={() => setDelAjuste({ id: l.id, label: `${l.produtor} · ${l.tipo} ${fmtBRL(Math.abs(l.valor))}` })}>
                      <Icon icon="lucide:trash-2" style={{ fontSize: 14 }} /> excluir
                    </button>
                  ) : <span className="corpo-suave text-[12px]">—</span>}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      <p className="corpo-suave mt-3 text-[12px]">
        Valores negativos saíram do saldo do produtor (repasse/antecipação/débito); positivos entraram (crédito). A Elleva retém tudo até você concluir cada repasse.
      </p>

      {/* MODAIS */}
      {pagar && (
        <PagarModal
          label={pagar.label}
          valor={pagar.valor}
          pending={pending}
          onClose={() => setPagar(null)}
          onConfirm={(method, ref, path) =>
            run(
              () => pagar.payoutId
                ? markPayoutPaid(pagar.payoutId, method, ref, path)
                : adminPayoutProducer(pagar.producerId!, method, ref, path),
              () => setPagar(null),
              "Repasse registrado como pago e o produtor foi avisado por e-mail."
            )
          }
        />
      )}
      {segurar && (
        <MotivoModal
          title="Segurar / negar repasse"
          message={<>{segurar.label} — o saldo volta a ficar disponível para ele.</>}
          label="Motivo (o produtor recebe por e-mail)"
          placeholder="ex.: evento em análise / pendência com o produtor"
          confirmLabel="Segurar"
          pending={pending}
          onClose={() => setSegurar(null)}
          onConfirm={(reason) => run(() => rejectPayout(segurar.id, reason), () => setSegurar(null), "Solicitação segurada e produtor avisado.")}
        />
      )}
      {lanc && (
        <LancamentoModal
          produtor={lanc}
          pending={pending}
          onClose={() => setLanc(null)}
          onConfirm={(kind, amount, reason) =>
            run(() => createAdjustment(lanc.producerId, kind, amount, reason), () => setLanc(null), "Lançamento registrado no saldo do produtor.")
          }
        />
      )}
      {antec && (
        <AntecipacaoModal
          produtor={antec}
          pending={pending}
          onClose={() => setAntec(null)}
          onConfirm={(enabled, pct) =>
            run(() => setAdvanceSettings(antec.producerId, enabled, pct), () => setAntec(null), "Configuração de antecipação salva.")
          }
        />
      )}
      <ConfirmDialog
        open={!!delAjuste}
        onClose={() => setDelAjuste(null)}
        onConfirm={() => delAjuste && run(() => deleteAdjustment(delAjuste.id), () => setDelAjuste(null), "Lançamento excluído.")}
        title="Excluir lançamento"
        message={<>{delAjuste?.label} — o saldo do produtor volta ao valor anterior.</>}
        confirmLabel="Excluir"
        danger
        pending={pending}
      />
    </div>
  );
}

// ── Modal: marcar pago (com upload de comprovante) ──────────────────────────
function PagarModal({
  label, valor, pending, onClose, onConfirm,
}: {
  label: string; valor: number; pending: boolean;
  onClose: () => void;
  onConfirm: (method: string, reference: string, receiptPath?: string) => void;
}) {
  const [method, setMethod] = useState("pix_manual");
  const [ref, setRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (ref.trim().length < 3 && !file) return setErro("Informe o ID da transferência ou anexe o comprovante.");
    let path: string | undefined;
    if (file) {
      const ok = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!ok.includes(file.type)) return setErro("Anexe JPG, PNG, WEBP ou PDF.");
      if (file.size > 5 * 1024 * 1024) return setErro("Arquivo acima de 5MB.");
      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() || "jpg";
        path = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
        const { error } = await supabase.storage.from("payout-receipts").upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
      } catch (e2) {
        setUploading(false);
        return setErro(e2 instanceof Error ? e2.message : "Falha ao subir o comprovante.");
      }
      setUploading(false);
    }
    onConfirm(method, ref.trim(), path);
  }

  return (
    <Modal open onClose={onClose} title="Registrar repasse pago" maxWidth={460}>
      <p className="corpo-suave m-0 mt-1">{label} — confirme depois de fazer o Pix. O produtor recebe um e-mail com o comprovante.</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <div>
          <label className={labelCls}>Valor pago</label>
          <p className="numero m-0 text-[20px] text-tinta">{fmtBRL(valor)}</p>
        </div>
        <div>
          <label className={labelCls}>Forma</label>
          <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="pix_manual">Pix (manual)</option>
            <option value="ted">TED / transferência</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>ID da transferência / observação</label>
          <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="ex.: E1234567890..." />
        </div>
        <div>
          <label className={labelCls}>Comprovante (imagem ou PDF)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-[10px] border-[1.5px] border-dashed border-tinta bg-papel-2 px-3 py-2.5 text-[13px] text-tinta file:mr-3 file:rounded-full file:border-0 file:bg-tinta file:px-3 file:py-1.5 file:text-[12px] file:text-papel"
          />
          {file && <p className="corpo-suave m-0 mt-1 text-[12px]">{file.name}</p>}
        </div>
        {erro && <p className="m-0 text-[13px] text-sol-escuro">{erro}</p>}
        <div className="mt-2 flex justify-end gap-2.5">
          <Button variante="contorno" type="button" onClick={onClose} disabled={pending || uploading}>Cancelar</Button>
          <Button variante="tinta" type="submit" disabled={pending || uploading}>
            {uploading ? "Enviando..." : pending ? "Aguarde..." : "Confirmar pago"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal: motivo (segurar/negar) ───────────────────────────────────────────
function MotivoModal({
  title, message, label, placeholder, confirmLabel, pending, onClose, onConfirm,
}: {
  title: string; message: React.ReactNode; label: string; placeholder: string; confirmLabel: string;
  pending: boolean; onClose: () => void; onConfirm: (v: string) => void;
}) {
  const [v, setV] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Modal open onClose={onClose} title={title} maxWidth={440}>
      <p className="corpo-suave m-0 mt-1">{message}</p>
      <form
        onSubmit={(e) => { e.preventDefault(); if (v.trim().length < 3) return setErro("Explique o motivo."); onConfirm(v.trim()); }}
        className="mt-4 flex flex-col gap-2"
      >
        <label className={labelCls}>{label}</label>
        <textarea className={`${inputCls} min-h-[90px]`} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} />
        {erro && <p className="m-0 text-[13px] text-sol-escuro">{erro}</p>}
        <div className="mt-2 flex justify-end gap-2.5">
          <Button variante="contorno" type="button" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button variante="tinta" type="submit" disabled={pending}>{pending ? "Aguarde..." : confirmLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal: lançamento manual (crédito/débito) ───────────────────────────────
function LancamentoModal({
  produtor, pending, onClose, onConfirm,
}: {
  produtor: ProducerFinance; pending: boolean; onClose: () => void;
  onConfirm: (kind: "credit" | "debit", amount: number, reason: string) => void;
}) {
  const [kind, setKind] = useState<"credit" | "debit">("debit");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const num = Number(valor.replace(/\./g, "").replace(",", "."));

  return (
    <Modal open onClose={onClose} title="Lançamento manual" maxWidth={460}>
      <p className="corpo-suave m-0 mt-1">
        {produtor.nome} — saldo atual disponível {fmtBRL(produtor.disponivel)}. Use para chargeback, multa, acerto ou bônus.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!Number.isFinite(num) || num <= 0) return setErro("Informe um valor válido.");
          if (motivo.trim().length < 3) return setErro("Descreva o motivo (fica no extrato do produtor).");
          onConfirm(kind, num, motivo.trim());
        }}
        className="mt-4 flex flex-col gap-3"
      >
        <div>
          <label className={labelCls}>Tipo</label>
          <div className="flex gap-2">
            {([["debit", "Débito (−)"], ["credit", "Crédito (+)"]] as const).map(([k, t]) => (
              <button key={k} type="button" onClick={() => setKind(k)}
                className={"min-h-[44px] flex-1 rounded-[10px] border-[1.5px] border-tinta px-3 text-[14px] font-medium transition-colors " +
                  (kind === k ? "bg-tinta text-papel" : "text-tinta hover:bg-papel-2")}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Valor (R$)</label>
          <input className={inputCls} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
        </div>
        <div>
          <label className={labelCls}>Motivo</label>
          <input className={inputCls} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="ex.: chargeback pedido #123" />
        </div>
        {erro && <p className="m-0 text-[13px] text-sol-escuro">{erro}</p>}
        <div className="mt-2 flex justify-end gap-2.5">
          <Button variante="contorno" type="button" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button variante="tinta" type="submit" disabled={pending}>{pending ? "Aguarde..." : "Lançar"}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal: antecipação (habilitar + taxa) ───────────────────────────────────
function AntecipacaoModal({
  produtor, pending, onClose, onConfirm,
}: {
  produtor: ProducerFinance; pending: boolean; onClose: () => void;
  onConfirm: (enabled: boolean, pct: number) => void;
}) {
  const [enabled, setEnabled] = useState(produtor.advanceEnabled);
  const [pct, setPct] = useState(String(produtor.advanceFeePct));
  const [erro, setErro] = useState<string | null>(null);
  const n = Number(pct.replace(",", "."));

  return (
    <Modal open onClose={onClose} title="Antecipação de recebimento" maxWidth={460}>
      <p className="corpo-suave m-0 mt-1">
        {produtor.nome} — permite sacar o saldo <strong>antes</strong> do evento, cobrando uma taxa da Elleva.
        Retido hoje: {fmtBRL(produtor.aLiberar)}.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (enabled && (!Number.isFinite(n) || n < 0 || n > 50)) return setErro("Taxa inválida (0 a 50%).");
          onConfirm(enabled, Number.isFinite(n) ? n : 0);
        }}
        className="mt-4 flex flex-col gap-3"
      >
        <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-tinta">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-[var(--color-sol)]" />
          Habilitar antecipação para este produtor
        </label>
        <div>
          <label className={labelCls}>Taxa de antecipação (%)</label>
          <input className={inputCls} inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} disabled={!enabled} placeholder="5" />
          <p className="corpo-suave m-0 mt-1 text-[12px]">
            Ex.: antecipando {fmtBRL(produtor.aLiberar)} com {Number.isFinite(n) ? n : 0}% → a Elleva retém{" "}
            {fmtBRL(Math.round(produtor.aLiberar * (Number.isFinite(n) ? n : 0)) / 100)}.
          </p>
        </div>
        {erro && <p className="m-0 text-[13px] text-sol-escuro">{erro}</p>}
        <div className="mt-2 flex justify-end gap-2.5">
          <Button variante="contorno" type="button" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button variante="tinta" type="submit" disabled={pending}>{pending ? "Aguarde..." : "Salvar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
