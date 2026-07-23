"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { savePayoutAccount } from "@/lib/actions/producer";

export interface PayoutData {
  pixType: string;
  pixKey: string;
  holder: string;
  doc: string;
}

const input =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";
const label = "mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-tinta-60";

const TIPOS = [
  { v: "cpf", t: "CPF" },
  { v: "cnpj", t: "CNPJ" },
  { v: "email", t: "E-mail" },
  { v: "phone", t: "Telefone" },
  { v: "random", t: "Aleatória" },
];

export function PayoutAccountForm({ initial }: { initial: PayoutData }) {
  const router = useRouter();
  const [f, setF] = useState<PayoutData>(initial);
  const [editing, setEditing] = useState(!initial.pixKey);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof PayoutData>(k: K, v: PayoutData[K]) => setF((s) => ({ ...s, [k]: v }));

  async function save() {
    setErr(null);
    setSaving(true);
    const r = await savePayoutAccount(f);
    setSaving(false);
    if (!r.ok) return setErr(r.error ?? "Erro ao salvar.");
    setEditing(false);
    setMsg("Conta de repasse salva.");
    setTimeout(() => setMsg(null), 4000);
    router.refresh();
  }

  if (!editing) {
    return (
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="rotulo text-tinta-60">
              {TIPOS.find((t) => t.v === f.pixType)?.t ?? "Chave"} Pix
            </p>
            <p className="m-0 mt-1 font-mono text-[15px] text-tinta">{f.pixKey}</p>
            <p className="corpo-suave m-0 mt-1">{f.holder}{f.doc ? ` · ${f.doc}` : ""}</p>
          </div>
          <Button variante="contorno" type="button" onClick={() => setEditing(true)}>Editar</Button>
        </div>
        {msg && <p className="corpo-suave mt-3 text-tinta">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <label className={label}>Tipo de chave</label>
          <select className={input} value={f.pixType} onChange={(e) => set("pixType", e.target.value)}>
            {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.t}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Chave Pix</label>
          <input className={input} value={f.pixKey} onChange={(e) => set("pixKey", e.target.value)} placeholder="Sua chave Pix" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Titular da conta</label>
          <input className={input} value={f.holder} onChange={(e) => set("holder", e.target.value)} placeholder="Nome de quem recebe" />
        </div>
        <div>
          <label className={label}>CPF/CNPJ do titular</label>
          <input className={input} value={f.doc} onChange={(e) => set("doc", e.target.value)} placeholder="Opcional" />
        </div>
      </div>
      {err && <p className="rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-3.5 py-2.5 text-[13.5px] text-sol-escuro">{err}</p>}
      <div className="flex gap-3">
        <Button type="button" variante="primario" onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar conta"}
        </Button>
        {initial.pixKey && (
          <Button type="button" variante="contorno" onClick={() => { setF(initial); setEditing(false); }}>Cancelar</Button>
        )}
      </div>
    </div>
  );
}
