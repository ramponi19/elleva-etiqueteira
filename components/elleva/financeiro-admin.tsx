"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PromptDialog } from "@/components/ui/modal";
import { markPayoutPaid, rejectPayout, adminPayoutProducer } from "@/lib/actions/payouts";
import { fmtBRL } from "@/lib/format";
import type { PlatformFinance } from "@/lib/finance";

export interface RequestRow {
  id: string;
  producer: string;
  pixKey: string | null;
  amount: number;
  created_at: string;
}

const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

export function FinanceiroAdmin({ plat, requests }: { plat: PlatformFinance; requests: RequestRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  // modais: {kind, id/producerId}
  const [pay, setPay] = useState<{ id: string; label: string } | null>(null);
  const [rej, setRej] = useState<{ id: string; label: string } | null>(null);
  const [direct, setDirect] = useState<{ producerId: string; label: string; amount: number } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, close: () => void) => {
    setErr(null);
    start(async () => {
      const r = await fn();
      close();
      if (!r.ok) setErr(r.error ?? "Erro.");
      else router.refresh();
    });
  };

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat("lucide:trending-up", "Receita da Elleva (taxas)", fmtBRL(plat.taxaTotal), "text-sol", "sua margem de serviço")}
        {stat("lucide:bar-chart-3", "GMV (vendido)", fmtBRL(plat.gmv), "text-tinta-60", "valor de face")}
        {stat("lucide:clock", "Repasses pendentes", fmtBRL(plat.solicitadoTotal), "text-tinta-60", `${requests.length} solicitação(ões)`)}
        {stat("lucide:check-check", "Já repassado", fmtBRL(plat.repassadoTotal), "text-palco")}
      </div>

      {err && <p className="mt-4 rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-4 py-2.5 text-[13.5px] text-sol-escuro">{err}</p>}

      {/* Fila de solicitações */}
      <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Solicitações de repasse</h2>
      <div className={card}>
        {requests.length === 0 ? (
          <p className="corpo-suave px-5 py-12 text-center">Nenhuma solicitação pendente.</p>
        ) : (
          requests.map((r, i) => (
            <div key={r.id} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
              <div className="min-w-0">
                <p className="m-0 text-[15px] font-medium text-tinta">{r.producer}</p>
                <p className="corpo-suave m-0">
                  Pix: <span className="font-mono">{r.pixKey || "— sem chave —"}</span> · {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <span className="numero text-[16px] text-tinta">{fmtBRL(Number(r.amount))}</span>
                <Button variante="tinta" onClick={() => setPay({ id: r.id, label: `${r.producer} · ${fmtBRL(Number(r.amount))}` })} disabled={pending}>Marcar pago</Button>
                <button type="button" onClick={() => setRej({ id: r.id, label: r.producer })} disabled={pending} className="text-[13px] text-sol-escuro underline underline-offset-2 disabled:opacity-50">segurar</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Saldo por produtor */}
      <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Saldo por produtor</h2>
      <div className="overflow-x-auto">
        <div className={`${card} min-w-[640px]`}>
          <div className="flex items-center gap-3 bg-papel-2 px-5 py-3">
            {["Produtor", "Líquido", "Disponível", "Em análise", "Repassado", ""].map((h, i) => (
              <span key={h} className={`rotulo text-tinta-60 ${i === 0 ? "flex-1" : "w-24 text-right"} ${i === 5 ? "!w-28" : ""}`}>{h}</span>
            ))}
          </div>
          {plat.produtores.length === 0 ? (
            <p className="corpo-suave px-5 py-12 text-center">Nenhum produtor com vendas.</p>
          ) : (
            plat.produtores.map((p, i) => (
              <div key={p.producerId} className={`flex items-center gap-3 px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
                <span className="flex-1 min-w-0 truncate">
                  <span className="block truncate text-[14px] font-medium text-tinta">{p.nome}</span>
                  <span className="block truncate font-mono text-[11px] text-tinta-60">{p.pixKey || "sem chave Pix"}</span>
                </span>
                <span className="numero w-24 text-right text-[14px] text-tinta-60">{fmtBRL(p.liquido)}</span>
                <span className="numero w-24 text-right text-[14px] font-semibold text-tinta">{fmtBRL(p.disponivel)}</span>
                <span className="numero w-24 text-right text-[14px] text-tinta-60">{fmtBRL(p.solicitado)}</span>
                <span className="numero w-24 text-right text-[14px] text-tinta-60">{fmtBRL(p.repassado)}</span>
                <span className="w-28 text-right">
                  {p.disponivel > 0 ? (
                    <button type="button" onClick={() => setDirect({ producerId: p.producerId, label: `${p.nome} · ${fmtBRL(p.disponivel)}`, amount: p.disponivel })} disabled={pending} className="rounded-full border-[1.5px] border-tinta px-3 py-1.5 text-[12px] font-medium text-tinta hover:bg-papel-2 disabled:opacity-50">Repassar</button>
                  ) : <Badge tom="papel">—</Badge>}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modais */}
      <PromptDialog
        open={!!pay}
        onClose={() => setPay(null)}
        onSubmit={(ref) => pay && run(() => markPayoutPaid(pay.id, "pix_manual", ref), () => setPay(null))}
        title="Marcar repasse como pago"
        message={<>{pay?.label} — informe o comprovante/ID da transferência Pix.</>}
        label="Comprovante / ID"
        placeholder="ex.: E1234... ou nº do recibo"
        confirmLabel="Confirmar pago"
        pending={pending}
        validate={(v) => (v.trim().length >= 3 ? null : "Informe o comprovante da transferência.")}
      />
      <PromptDialog
        open={!!direct}
        onClose={() => setDirect(null)}
        onSubmit={(ref) => direct && run(() => adminPayoutProducer(direct.producerId, "pix_manual", ref), () => setDirect(null))}
        title="Repassar saldo disponível"
        message={<>{direct?.label} — informe o comprovante/ID da transferência Pix já feita.</>}
        label="Comprovante / ID"
        placeholder="ex.: E1234... ou nº do recibo"
        confirmLabel="Confirmar repasse"
        pending={pending}
        validate={(v) => (v.trim().length >= 3 ? null : "Informe o comprovante da transferência.")}
      />
      <PromptDialog
        open={!!rej}
        onClose={() => setRej(null)}
        onSubmit={(reason) => rej && run(() => rejectPayout(rej.id, reason), () => setRej(null))}
        title="Segurar / negar repasse"
        message={<>{rej?.label} — por que este repasse está sendo segurado?</>}
        label="Motivo"
        placeholder="ex.: evento em análise / pendência com o produtor"
        confirmLabel="Segurar"
        pending={pending}
        validate={(v) => (v.trim().length >= 3 ? null : "Explique o motivo.")}
      />
    </div>
  );
}
