"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { createGateOperator, setGateOperatorActive, deleteGateOperator, regenerateGateOperatorPin } from "@/lib/actions/operators";
import { formatCPF } from "@/lib/cpf";

export interface OperadorView {
  id: string;
  name: string;
  doc: string;
  pin: string;
  active: boolean;
}

const input =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";

export function OperadoresPortaria({ initial }: { initial: OperadorView[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [nome, setNome] = useState("");
  const [doc, setDoc] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    start(async () => {
      const r = await createGateOperator(nome, doc);
      if (!r.ok) return setErr(r.error);
      setMsg(`Operador criado. PIN: ${r.pin}`);
      setNome("");
      setDoc("");
      router.refresh();
    });
  }
  const toggle = (id: string, active: boolean) =>
    start(async () => {
      await setGateOperatorActive(id, active);
      router.refresh();
    });
  const remove = (id: string) =>
    start(async () => {
      await deleteGateOperator(id);
      router.refresh();
    });
  const novoPin = (id: string, name: string) =>
    start(async () => {
      setErr(null);
      setMsg(null);
      const r = await regenerateGateOperatorPin(id);
      if (!r.ok) return setErr(r.error);
      setMsg(`Novo PIN de ${name}: ${r.pin}. O anterior parou de valer.`);
      router.refresh();
    });

  return (
    <div>
      <p className="corpo-suave mb-3">
        Cadastre quem vai validar na porta. Cada um recebe um <strong>PIN de 6 dígitos</strong>, gerado aleatoriamente —
        passe o PIN só pra pessoa; na portaria ela digita e já entra identificada. Se vazar, gere um novo.
      </p>
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <input className={input} placeholder="Nome do operador" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input className={input} inputMode="numeric" placeholder="CPF" value={doc} onChange={(e) => setDoc(formatCPF(e.target.value))} />
        <Button type="submit" variante="tinta" disabled={pending} className="flex-shrink-0">Adicionar</Button>
      </form>
      {err && <p className="mt-2 text-[13px] text-sol-escuro">{err}</p>}
      {msg && <p className="mt-2 text-[13px] font-medium text-palco">{msg}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {initial.length === 0 && (
          <p className="corpo-suave">Nenhum operador cadastrado. Sem operadores, a portaria pede nome + CPF de quem validar.</p>
        )}
        {initial.map((op) => (
          <div key={op.id} className="flex items-center justify-between gap-3 rounded-[10px] border-[1.5px] border-tinta px-4 py-3">
            <div className="min-w-0">
              <p className="m-0 text-[15px] font-medium text-tinta">
                {op.name}
                {!op.active && <span className="ml-2 rounded-full bg-papel-2 px-2 py-0.5 text-[11px] text-tinta-60">inativo</span>}
              </p>
              <p className="m-0 mt-0.5 text-[13px] text-tinta-60">
                PIN <strong className="numero text-tinta">{op.pin}</strong> · CPF {formatCPF(op.doc)}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
              <button type="button" onClick={() => novoPin(op.id, op.name)} disabled={pending} className="text-[13px] text-sol-escuro underline underline-offset-2 disabled:opacity-50">
                novo PIN
              </button>
              <button type="button" onClick={() => toggle(op.id, !op.active)} disabled={pending} className="text-[13px] text-sol-escuro underline underline-offset-2 disabled:opacity-50">
                {op.active ? "desativar" : "ativar"}
              </button>
              <button type="button" onClick={() => remove(op.id)} disabled={pending} aria-label={`Remover ${op.name}`} className="text-tinta-60 hover:text-sol-escuro disabled:opacity-50">
                <Icon icon="lucide:trash-2" style={{ fontSize: 17 }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
