"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isValidCPF, formatCPF } from "@/lib/cpf";
import { maskPhone, maskCEP } from "@/lib/format";
import { salvarDadosCompra, type DadosCompraInput } from "@/lib/actions/perfil";

/** Flags de sessão (só neste navegador/aba):
 *  - NOVO: setada na criação da conta → abre o modal assim que a sessão existir.
 *  - VISTO: já mostramos (ou o usuário adiou) nesta sessão → não insiste. */
export const CADASTRO_NOVO_KEY = "elleva_cadastro_novo";
const VISTO_KEY = "elleva_cadastro_visto";

const vazio: DadosCompraInput = {
  fullName: "", cpf: "", birthDate: "", phone: "", cep: "",
  address: "", addressNumber: "", addressComplement: "", neighborhood: "", city: "", state: "",
};

const inputCls =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-tinta-60";

function ss(fn: (s: Storage) => void) {
  try { fn(sessionStorage); } catch { /* storage bloqueado: segue sem persistir */ }
}

/** Portão global (montado no layout raiz): quando a conta é criada — ou quando um
 *  usuário logado ainda não tem CPF — abre o modal "Complete seu cadastro" uma vez
 *  por sessão. Sem custo no servidor para visitantes: só consulta o perfil quando
 *  há sessão no navegador. */
export function CompletarCadastroGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<DadosCompraInput>(vazio);

  const verificar = useCallback(async (forcar: boolean) => {
    // No checkout o CPF já é pedido no próprio fluxo; não empilhar modal.
    if (pathname?.startsWith("/checkout") || pathname?.startsWith("/validar")) return;
    let visto = false;
    let novo = false;
    ss((s) => { visto = s.getItem(VISTO_KEY) === "1"; novo = s.getItem(CADASTRO_NOVO_KEY) === "1"; });
    if (!forcar && !novo && visto) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: p } = await supabase
      .from("profiles")
      .select("full_name, cpf, birth_date, phone, cep, address, address_number, address_complement, neighborhood, city, state")
      .eq("id", session.user.id)
      .maybeSingle();
    ss((s) => { s.setItem(VISTO_KEY, "1"); s.removeItem(CADASTRO_NOVO_KEY); });
    if (p?.cpf) return; // cadastro já completo no que importa pro ingresso
    setInitial({
      fullName: p?.full_name ?? (session.user.user_metadata?.full_name as string | undefined) ?? "",
      cpf: p?.cpf ?? "", birthDate: p?.birth_date ?? "", phone: p?.phone ?? "", cep: p?.cep ?? "",
      address: p?.address ?? "", addressNumber: p?.address_number ?? "", addressComplement: p?.address_complement ?? "",
      neighborhood: p?.neighborhood ?? "", city: p?.city ?? "", state: p?.state ?? "",
    });
    setOpen(true);
  }, [pathname]);

  useEffect(() => {
    // fora do corpo do efeito (tick seguinte): a checagem é assíncrona e só
    // abre o modal depois de consultar sessão + perfil
    const t = setTimeout(() => void verificar(false), 0);
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => {
      // login/cadastro feito no modal da própria página (sem recarregar)
      if (ev === "SIGNED_IN") setTimeout(() => void verificar(true), 400);
    });
    return () => { clearTimeout(t); sub.subscription.unsubscribe(); };
  }, [verificar]);

  if (!open) return null;
  return (
    <CompletarCadastroModal
      initial={initial}
      onClose={() => setOpen(false)}
      onSaved={() => { setOpen(false); router.refresh(); }}
    />
  );
}

export function CompletarCadastroModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: DadosCompraInput;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [b, setB] = useState<DadosCompraInput>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof DadosCompraInput>(k: K, v: string) => setB((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

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
    } catch { /* preenche à mão */ }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!b.fullName.trim()) return setErr("Informe seu nome completo.");
    if (!isValidCPF(b.cpf)) return setErr("Esse CPF não bateu. Confere os números?");
    setSaving(true);
    const r = await salvarDadosCompra(b);
    setSaving(false);
    if (!r.ok) return setErr(r.error);
    onSaved();
  }

  return (
    <div
      className="eauth fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(8_7_10/0.72)] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Complete seu cadastro"
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-papel p-6 shadow-[4px_4px_0_var(--color-tinta)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-[8px] text-tinta-60 hover:bg-papel-2 hover:text-tinta"
        >
          <Icon icon="lucide:x" style={{ fontSize: 20 }} />
        </button>

        <p className="rotulo m-0 text-sol">Falta pouco</p>
        <h2 className="m-0 mt-1 pr-8 text-[22px] font-extrabold leading-tight text-tinta">Complete seu cadastro</h2>
        <p className="corpo-suave m-0 mt-1.5 mb-4">
          Seus ingressos saem com nome e CPF — e o documento é conferido na portaria. Leva um minuto.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className={labelCls} htmlFor="cc-nome">Nome completo</label>
            <input id="cc-nome" name="name" autoComplete="name" className={inputCls} value={b.fullName} onChange={(e) => set("fullName", e.target.value)} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="cc-cpf">CPF</label>
              <input id="cc-cpf" inputMode="numeric" className={inputCls} value={b.cpf} onChange={(e) => set("cpf", formatCPF(e.target.value))} placeholder="___.___.___-__" required />
            </div>
            <div>
              <label className={labelCls} htmlFor="cc-nasc">Data de nascimento</label>
              <input id="cc-nasc" type="date" autoComplete="bday" className={inputCls} value={b.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="cc-tel">Telefone / WhatsApp</label>
              <input id="cc-tel" inputMode="numeric" autoComplete="tel" className={inputCls} value={b.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} placeholder="(__) _____-____" />
            </div>
            <div>
              <label className={labelCls} htmlFor="cc-cep">CEP</label>
              <input
                id="cc-cep"
                inputMode="numeric"
                autoComplete="postal-code"
                className={inputCls}
                value={b.cep}
                onChange={(e) => { const v = maskCEP(e.target.value); set("cep", v); if (v.replace(/\D/g, "").length === 8) void lookupCep(v); }}
                placeholder="_____-___"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
            <div>
              <label className={labelCls} htmlFor="cc-end">Endereço</label>
              <input id="cc-end" autoComplete="address-line1" className={inputCls} value={b.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="cc-num">Número</label>
              <input id="cc-num" className={inputCls} value={b.addressNumber} onChange={(e) => set("addressNumber", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="cc-comp">Complemento</label>
              <input id="cc-comp" autoComplete="address-line2" className={inputCls} value={b.addressComplement} onChange={(e) => set("addressComplement", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="cc-bairro">Bairro</label>
              <input id="cc-bairro" className={inputCls} value={b.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_90px]">
            <div>
              <label className={labelCls} htmlFor="cc-cidade">Cidade</label>
              <input id="cc-cidade" autoComplete="address-level2" className={inputCls} value={b.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="cc-uf">UF</label>
              <input id="cc-uf" autoComplete="address-level1" maxLength={2} className={inputCls} value={b.state} onChange={(e) => set("state", e.target.value.toUpperCase())} placeholder="SP" />
            </div>
          </div>

          {err && <p className="m-0 rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-3 py-2 text-[13px] text-sol-escuro">{err}</p>}

          <div className="mt-1 flex flex-col gap-2 sm:flex-row-reverse">
            <Button type="submit" variante="primario" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Salvando..." : "Salvar e continuar"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] cursor-pointer border-0 bg-transparent px-2 text-[14px] font-medium text-tinta-60 underline underline-offset-2 hover:text-tinta"
            >
              Preencher depois
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
