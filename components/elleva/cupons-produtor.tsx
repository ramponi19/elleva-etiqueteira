"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtBRL } from "@/lib/format";
import { createEventCoupon, toggleEventCoupon } from "@/lib/actions/producer";

export interface CupomView {
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  event_id: string | null;
  eventTitle: string;
}

const field = "rounded-[10px] border-[1.5px] border-tinta bg-white px-3 py-2.5 text-[14px] text-tinta outline-none focus:border-sol";

export function CuponsProdutor({
  eventos,
  cupons,
}: {
  eventos: { id: string; title: string }[];
  cupons: CupomView[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [eventId, setEventId] = useState(eventos[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function criar(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await createEventCoupon({
        eventId,
        code,
        discountType: type,
        discountValue: Number(value.replace(",", ".")),
        maxUses: maxUses ? Number(maxUses) : undefined,
      });
      if (!r.ok) return setErr(r.error ?? "Erro.");
      setCode(""); setValue(""); setMaxUses("");
      setMsg("Cupom criado.");
      router.refresh();
    });
  }

  function toggle(c: CupomView) {
    startTransition(async () => {
      const r = await toggleEventCoupon(c.code, !c.active);
      if (r.ok) router.refresh();
      else setErr(r.error ?? "Erro.");
    });
  }

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={criar} className={`${card} flex flex-col gap-4 p-5`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-tinta-60">Evento</label>
            <select className={`${field} w-full`} value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {eventos.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-tinta-60">Código</label>
            <input className={`${field} w-full font-mono uppercase`} placeholder="EX: AMIGO10" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-tinta-60">Tipo</label>
            <select className={field} value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
              <option value="percent">% percentual</option>
              <option value="fixed">R$ fixo</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-tinta-60">Desconto</label>
            <input className={`${field} w-[110px]`} type="number" min="0" step="0.01" placeholder={type === "percent" ? "10" : "20"} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-tinta-60">Usos (opc.)</label>
            <input className={`${field} w-[120px]`} type="number" min="1" placeholder="ilimitado" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </div>
          <Button type="submit" variante="primario" disabled={pending || !eventId}>Criar cupom</Button>
        </div>
        {err && <p className="text-[13px] text-sol-escuro">{err}</p>}
        {msg && <p className="text-[13px] text-tinta">{msg}</p>}
      </form>

      <div className={card}>
        {cupons.length === 0 ? (
          <p className="corpo-suave px-5 py-12 text-center">Você ainda não criou cupons. Crie um acima pra o seu evento.</p>
        ) : (
          cupons.map((c, i) => (
            <div key={c.code} className={clsx("flex flex-wrap items-center justify-between gap-3 px-5 py-3.5", i && "border-t-[1.5px] border-dashed border-tinta")}>
              <div>
                <p className="m-0 font-mono text-[14px] font-semibold tracking-wide text-tinta">{c.code}</p>
                <p className="corpo-suave m-0">
                  {c.discount_type === "percent" ? `${c.discount_value}% off` : `${fmtBRL(Number(c.discount_value))} off`}
                  {" · "}{c.used_count}{c.max_uses != null ? `/${c.max_uses}` : ""} usos · {c.eventTitle}
                </p>
              </div>
              <button type="button" onClick={() => toggle(c)} disabled={pending} className="rounded-full border-[1.5px] border-tinta px-3 py-1.5 text-[12px] font-medium text-tinta hover:bg-papel-2 disabled:opacity-50">
                <Badge tom={c.active ? "sol" : "papel"}>{c.active ? "Ativo" : "Inativo"}</Badge>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
