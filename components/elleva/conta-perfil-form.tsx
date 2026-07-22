"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export interface PerfilData {
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  cep: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const input =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[15px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol disabled:border-tinta/40 disabled:bg-papel-2 disabled:text-tinta-60";
const labelCls = "mb-1.5 block text-[13.5px] font-medium text-tinta";

export function ContaPerfilForm({
  userId,
  email: initialEmail,
  initial,
}: {
  userId: string;
  email: string;
  initial: PerfilData;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [b, setB] = useState<PerfilData>(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof PerfilData>(k: K, v: PerfilData[K]) => setB((s) => ({ ...s, [k]: v }));

  // identidade
  const [email, setEmail] = useState(initialEmail);
  const [editEmail, setEditEmail] = useState(false);
  const [pass, setPass] = useState("");
  const [editPass, setEditPass] = useState(false);
  const [editName, setEditName] = useState(false);

  function flash(setter: (v: string | null) => void, v: string) {
    setter(v);
    setTimeout(() => setter(null), 4000);
  }

  async function saveName() {
    await supabase.from("profiles").update({ full_name: b.fullName }).eq("id", userId);
    setEditName(false);
    flash(setMsg, "Nome atualizado.");
    router.refresh();
  }
  async function saveEmail() {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) flash(setErr, error.message);
    else flash(setMsg, "Enviamos um link para confirmar o novo e-mail.");
    setEditEmail(false);
  }
  async function savePass() {
    if (pass.length < 8) return flash(setErr, "A senha precisa de ao menos 8 caracteres.");
    const { error } = await supabase.auth.updateUser({ password: pass });
    if (error) flash(setErr, error.message);
    else flash(setMsg, "Senha atualizada.");
    setPass("");
    setEditPass(false);
  }

  async function lookupCep(raw: string) {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const d = await (await fetch(`https://viacep.com.br/ws/${cep}/json/`)).json();
      if (d.erro) return;
      setB((s) => ({
        ...s,
        address: d.logradouro || s.address,
        neighborhood: d.bairro || s.neighborhood,
        city: d.localidade || s.city,
        state: d.uf || s.state,
      }));
    } catch {
      /* preenche à mão */
    }
  }

  async function saveBuyer() {
    setErr(null);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: b.fullName || null,
        cpf: b.cpf || null,
        birth_date: b.birthDate || null,
        phone: b.phone || null,
        cep: b.cep || null,
        address: b.address || null,
        address_number: b.addressNumber || null,
        address_complement: b.addressComplement || null,
        neighborhood: b.neighborhood || null,
        city: b.city || null,
        state: b.state || null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) return flash(setErr, error.message);
    setEditing(false);
    flash(setMsg, "Dados de compra salvos.");
    router.refresh();
  }

  function excluir() {
    if (!confirm("Tem certeza que deseja excluir sua conta? Esta ação é permanente.")) return;
    window.location.href = `mailto:contato@ellevaeventos.com.br?subject=${encodeURIComponent(
      "Exclusão de conta"
    )}&body=${encodeURIComponent(`Solicito a exclusão da minha conta (${initialEmail}).`)}`;
  }

  // barra de conclusão
  const campos = [b.fullName, b.cpf, b.birthDate, b.phone, b.cep, b.address, b.city, b.state];
  const completion = Math.round((campos.filter((v) => v && v.trim()).length / campos.length) * 100);

  const iconBtn = "text-sol-escuro hover:text-sol";

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      {/* ── Dados da Conta ───────────────────────────────── */}
      <div className="lg:border-r-[1.5px] lg:border-dashed lg:border-tinta lg:pr-8">
        <h2 className="mb-5 text-[22px] font-medium text-tinta">Dados da Conta</h2>

        {completion < 100 && (
          <div className="mb-6 rounded-[var(--radius-card)] bg-tinta p-4 text-papel">
            <p className="m-0 text-[13.5px] leading-snug">
              Complete seus dados para garantir mais segurança no acesso à sua conta!
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-papel" style={{ width: `${completion}%` }} />
              </div>
              <span className="text-[12px] font-bold">{completion}%</span>
            </div>
          </div>
        )}

        {/* Nome */}
        <label className={labelCls}>Nome</label>
        <div className="mb-4 flex items-center gap-2">
          <input
            className={input}
            value={b.fullName}
            disabled={!editName}
            onChange={(e) => set("fullName", e.target.value)}
          />
          {editName ? (
            <button type="button" onClick={saveName} className={iconBtn} aria-label="Salvar nome">
              <Icon icon="lucide:check" style={{ fontSize: 18 }} />
            </button>
          ) : (
            <button type="button" onClick={() => setEditName(true)} className={iconBtn} aria-label="Editar nome">
              <Icon icon="lucide:pencil" style={{ fontSize: 16 }} />
            </button>
          )}
        </div>

        {/* E-mail */}
        <label className={labelCls}>E-mail</label>
        <div className="mb-4 flex items-center gap-2">
          <input
            className={input}
            type="email"
            value={email}
            disabled={!editEmail}
            onChange={(e) => setEmail(e.target.value)}
          />
          {editEmail ? (
            <button type="button" onClick={saveEmail} className={iconBtn} aria-label="Salvar e-mail">
              <Icon icon="lucide:check" style={{ fontSize: 18 }} />
            </button>
          ) : (
            <button type="button" onClick={() => setEditEmail(true)} className={iconBtn} aria-label="Editar e-mail">
              <Icon icon="lucide:pencil" style={{ fontSize: 16 }} />
            </button>
          )}
        </div>

        {/* Senha */}
        <label className={labelCls}>Senha</label>
        <div className="mb-4 flex items-center gap-2">
          <input
            className={input}
            type="password"
            value={editPass ? pass : "••••••••"}
            disabled={!editPass}
            placeholder="Nova senha"
            onChange={(e) => setPass(e.target.value)}
          />
          {editPass ? (
            <button type="button" onClick={savePass} className={iconBtn} aria-label="Salvar senha">
              <Icon icon="lucide:check" style={{ fontSize: 18 }} />
            </button>
          ) : (
            <button type="button" onClick={() => setEditPass(true)} className={iconBtn} aria-label="Alterar senha">
              <Icon icon="lucide:pencil" style={{ fontSize: 16 }} />
            </button>
          )}
        </div>

        <div className="mt-8">
          <p className="rotulo text-tinta-60">Gerenciamento de conta</p>
          <button type="button" onClick={excluir} className="mt-1 text-[14px] font-medium text-sol-escuro underline underline-offset-2">
            Excluir a conta
          </button>
        </div>
      </div>

      {/* ── Dados de compra ──────────────────────────────── */}
      <div>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-medium text-tinta">Dados de compra</h2>
          {!editing && (
            <Button type="button" variante="primario" onClick={() => setEditing(true)}>
              Editar dados
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nome do comprador</label>
            <input className={input} disabled={!editing} value={b.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>CPF</label>
              <input className={input} disabled={!editing} value={b.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="___.___.___-__" />
            </div>
            <div>
              <label className={labelCls}>Data de Nascimento</label>
              <input className={input} type="date" disabled={!editing} value={b.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Telefone</label>
              <input className={input} disabled={!editing} value={b.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(__) _____-____" />
            </div>
            <div>
              <label className={labelCls}>CEP</label>
              <input
                className={input}
                disabled={!editing}
                value={b.cep}
                onChange={(e) => set("cep", e.target.value)}
                onBlur={(e) => editing && lookupCep(e.target.value)}
                placeholder="_____-___"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Endereço</label>
              <input className={input} disabled={!editing} value={b.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Bairro</label>
              <input className={input} disabled={!editing} value={b.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Número</label>
              <input className={input} disabled={!editing} value={b.addressNumber} onChange={(e) => set("addressNumber", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Complemento</label>
              <input className={input} disabled={!editing} value={b.addressComplement} onChange={(e) => set("addressComplement", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Cidade</label>
              <input className={input} disabled={!editing} value={b.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <input className={input} disabled={!editing} value={b.state} onChange={(e) => set("state", e.target.value)} placeholder="UF" />
            </div>
          </div>

          {editing && (
            <div className="flex gap-3">
              <Button type="button" variante="primario" onClick={saveBuyer} disabled={saving}>
                {saving ? "Salvando..." : "Salvar dados"}
              </Button>
              <Button
                type="button"
                variante="contorno"
                onClick={() => {
                  setB(initial);
                  setEditing(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      {(msg || err) && (
        <p
          className={clsx(
            "rounded-[10px] border-[1.5px] px-4 py-3 text-[14px] lg:col-span-2",
            err ? "border-sol text-sol-escuro" : "border-tinta text-tinta"
          )}
        >
          {err || msg}
        </p>
      )}
    </div>
  );
}
