"use client";

// ============================================================
// /admin/pagamentos — cadastro da instituição em que a Elleva trabalha
// ============================================================
// A tela nunca recebe segredo: o servidor manda só a máscara. Por isso o campo
// de token vem VAZIO na edição e "vazio = manter o que está salvo".
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import {
  salvarConta,
  testarConta,
  ativarConta,
  desativarTodas,
  excluirConta,
  type ContaPagamentoView,
  type EstadoPagamentos,
} from "@/lib/actions/payment-accounts";

const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";
const field =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";
const label = "rotulo mb-1.5 block text-tinta-60";

type Rascunho = {
  id?: string;
  provider: string;
  labelConta: string;
  environment: "sandbox" | "production";
  accessToken: string;
  webhookSecret: string;
  publicKey: string;
};

function vazio(providerPadrao: string): Rascunho {
  return {
    provider: providerPadrao,
    labelConta: "",
    environment: "production",
    accessToken: "",
    webhookSecret: "",
    publicKey: "",
  };
}

function Selo({ env }: { env: "sandbox" | "production" }) {
  const sandbox = env === "sandbox";
  return (
    <span
      className="rounded-[var(--radius-pill)] border-[1.5px] px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wider"
      style={
        sandbox
          ? { borderColor: "var(--color-tinta)", color: "var(--color-tinta-60)" }
          : { borderColor: "var(--color-sol)", color: "var(--color-sol-escuro)" }
      }
    >
      {sandbox ? "Sandbox" : "Produção"}
    </span>
  );
}

function quando(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function ContasPagamento({ estado }: { estado: EstadoPagamentos }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const padrao = estado.instituicoes[0]?.id ?? "mercadopago";

  const [form, setForm] = useState<Rascunho | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<{ acao: "ativar" | "excluir"; id: string } | null>(null);

  const inst = estado.instituicoes.find((i) => i.id === (form?.provider ?? padrao)) ?? estado.instituicoes[0];
  const set = <K extends keyof Rascunho>(k: K, v: Rascunho[K]) =>
    setForm((s) => (s ? { ...s, [k]: v } : s));

  function recarregar(msg?: string) {
    setErro(null);
    if (msg) setAviso(msg);
    router.refresh();
  }

  function abrirNova() {
    setErro(null);
    setAviso(null);
    setForm(vazio(padrao));
  }

  function abrirEdicao(c: ContaPagamentoView) {
    setErro(null);
    setAviso(null);
    setForm({
      id: c.id,
      provider: c.provider,
      labelConta: c.label,
      environment: c.environment,
      accessToken: "",
      webhookSecret: "",
      publicKey: c.publicKey ?? "",
    });
  }

  async function salvar() {
    if (!form) return;
    setErro(null);
    const r = await salvarConta({
      id: form.id,
      provider: form.provider,
      label: form.labelConta,
      environment: form.environment,
      accessToken: form.accessToken || undefined,
      webhookSecret: form.webhookSecret || undefined,
      publicKey: form.publicKey || undefined,
    });
    if (!r.ok) return setErro(r.error ?? "Não foi possível salvar.");
    setForm(null);
    recarregar(
      form.id
        ? "Conta atualizada."
        : "Conta cadastrada. Ela ainda NÃO está valendo — clique em “Ativar” quando quiser cobrar nela."
    );
  }

  function testar(id: string) {
    setErro(null);
    setAviso(null);
    iniciar(async () => {
      const r = await testarConta(id);
      if (r.ok) setAviso(`Conexão OK — o gateway respondeu: ${r.info}`);
      else setErro(r.info);
      router.refresh();
    });
  }

  function ativar(id: string) {
    setConfirmando(null);
    setErro(null);
    setAviso(null);
    iniciar(async () => {
      const r = await ativarConta(id);
      if (!r.ok) return setErro(r.error ?? "Não foi possível ativar.");
      recarregar(`Pronto: as cobranças agora saem nessa conta (${r.info}).`);
    });
  }

  function excluir(id: string) {
    setConfirmando(null);
    setErro(null);
    iniciar(async () => {
      const r = await excluirConta(id);
      if (!r.ok) return setErro(r.error ?? "Não foi possível excluir.");
      recarregar("Conta excluída.");
    });
  }

  function voltarPraEnv() {
    setConfirmando(null);
    setErro(null);
    iniciar(async () => {
      const r = await desativarTodas();
      if (!r.ok) return setErro(r.error ?? "Não foi possível desativar.");
      recarregar("Nenhuma conta ativa — o checkout voltou a usar as variáveis de ambiente.");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ---- o que está valendo agora ---- */}
      <div className={`${card} p-5`}>
        <p className="rotulo text-tinta-60">Valendo agora no checkout</p>
        {estado.fonte === "banco" && (
          <p className="m-0 mt-1.5 flex items-center gap-2 text-[16px] font-semibold text-tinta">
            <Icon icon="lucide:circle-check" style={{ fontSize: 18, color: "var(--color-sol-escuro)" }} />
            {estado.fonteLabel}
          </p>
        )}
        {estado.fonte === "env" && (
          <>
            <p className="m-0 mt-1.5 flex items-center gap-2 text-[16px] font-semibold text-tinta">
              <Icon icon="lucide:terminal" style={{ fontSize: 18 }} />
              Variáveis de ambiente (MP_ACCESS_TOKEN)
            </p>
            <p className="corpo-suave m-0 mt-1">
              É o jeito antigo: trocar de conta exige mexer na Vercel e redeployar. Cadastre a conta aqui e
              ative pra parar de depender disso.
            </p>
          </>
        )}
        {estado.fonte === "nenhuma" && (
          <>
            <p className="m-0 mt-1.5 flex items-center gap-2 text-[16px] font-semibold text-tinta">
              <Icon icon="lucide:triangle-alert" style={{ fontSize: 18, color: "var(--color-sol-escuro)" }} />
              Nenhuma credencial configurada
            </p>
            <p className="corpo-suave m-0 mt-1">
              Sem credencial o checkout não cobra de verdade. Cadastre e ative uma conta abaixo.
            </p>
          </>
        )}
        {estado.fonte === "banco" && (
          <button
            type="button"
            onClick={voltarPraEnv}
            disabled={pendente}
            className="mt-3 cursor-pointer border-0 bg-transparent p-0 text-[13px] text-tinta-60 underline hover:text-tinta"
          >
            Desativar e voltar às variáveis de ambiente
          </button>
        )}
      </div>

      {/* ---- chave de criptografia ausente ---- */}
      {!estado.cifraPronta && (
        <div className={`${card} border-sol p-5`}>
          <p className="m-0 flex items-center gap-2 text-[15px] font-semibold text-tinta">
            <Icon icon="lucide:key-round" style={{ fontSize: 18, color: "var(--color-sol-escuro)" }} />
            Falta a chave de criptografia (SETTINGS_ENC_KEY)
          </p>
          <p className="corpo-suave m-0 mt-1.5">
            O access token só é guardado cifrado. Gere uma chave de 32 bytes, coloque como
            <code className="mx-1 rounded bg-papel-2 px-1.5 py-0.5 font-mono text-[12.5px]">SETTINGS_ENC_KEY</code>
            nas variáveis da Vercel (Production e Preview) e redeploy. Depois disso o cadastro funciona.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-[10px] bg-papel-2 px-3.5 py-2.5 font-mono text-[12.5px] text-tinta">
            {estado.comandoChave}
          </pre>
          <p className="corpo-suave m-0 mt-2">
            Importante: se essa chave mudar depois, os tokens já salvos param de abrir e você precisa colar as
            credenciais de novo.
          </p>
        </div>
      )}

      {erro && (
        <p className="m-0 rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-3.5 py-2.5 text-[13.5px] text-sol-escuro">
          {erro}
        </p>
      )}
      {aviso && (
        <p className="m-0 rounded-[10px] border-[1.5px] border-tinta bg-papel-2 px-3.5 py-2.5 text-[13.5px] text-tinta">
          {aviso}
        </p>
      )}

      {/* ---- lista ---- */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-dashed border-tinta px-5 py-4">
          <p className="m-0 text-[15px] font-semibold text-tinta">Contas cadastradas</p>
          {!form && (
            <Button type="button" variante="contorno" onClick={abrirNova}>
              <Icon icon="lucide:plus" style={{ fontSize: 16 }} /> Nova conta
            </Button>
          )}
        </div>

        {estado.contas.map((c) => (
          <div key={c.id} className="border-b-[1.5px] border-dashed border-tinta px-5 py-4 last:border-b-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 flex flex-wrap items-center gap-2 text-[15px] font-semibold text-tinta">
                  {c.label}
                  <Selo env={c.environment} />
                  {c.active && (
                    <span className="rounded-[var(--radius-pill)] bg-sol px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wider text-tinta">
                      Ativa
                    </span>
                  )}
                </p>
                <p className="corpo-suave m-0 mt-1">
                  {c.providerRotulo} · <span className="font-mono">{c.accessTokenMask ?? "token ilegível"}</span>
                  {c.temWebhookSecret ? " · webhook assinado" : " · sem segredo de webhook"}
                </p>
                {c.lastCheckAt && (
                  <p className="corpo-suave m-0 mt-1 flex items-center gap-1.5">
                    <Icon
                      icon={c.lastCheckOk ? "lucide:circle-check" : "lucide:circle-x"}
                      style={{ fontSize: 14, color: c.lastCheckOk ? undefined : "var(--color-sol-escuro)" }}
                    />
                    {quando(c.lastCheckAt)} — {c.lastCheckInfo}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variante="contorno" onClick={() => testar(c.id)} disabled={pendente}>
                  Testar
                </Button>
                <Button type="button" variante="contorno" onClick={() => abrirEdicao(c)} disabled={pendente}>
                  Editar
                </Button>
                {!c.active && (
                  <Button
                    type="button"
                    variante="tinta"
                    onClick={() => setConfirmando({ acao: "ativar", id: c.id })}
                    disabled={pendente}
                  >
                    Ativar
                  </Button>
                )}
                {!c.active && (
                  <button
                    type="button"
                    onClick={() => setConfirmando({ acao: "excluir", id: c.id })}
                    disabled={pendente}
                    aria-label={`Excluir ${c.label}`}
                    className="cursor-pointer rounded-[10px] border-0 bg-transparent p-2 text-tinta-60 hover:text-sol-escuro"
                  >
                    <Icon icon="lucide:trash-2" style={{ fontSize: 17 }} />
                  </button>
                )}
              </div>
            </div>

            {confirmando?.id === c.id && (
              <div className="mt-3 rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.06)] px-3.5 py-3">
                <p className="m-0 text-[13.5px] text-tinta">
                  {confirmando.acao === "ativar" ? (
                    <>
                      Confirmar: a partir de agora <strong>todo Pix e todo cartão</strong> do site cai em{" "}
                      <strong>{c.label}</strong>
                      {c.environment === "sandbox" ? " (SANDBOX — nenhum dinheiro real entra)" : " (produção)"}. Vou
                      testar a credencial no gateway antes de ativar.
                    </>
                  ) : (
                    <>
                      Excluir <strong>{c.label}</strong>? O cadastro sai daqui (a conta no gateway não é afetada).
                    </>
                  )}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variante="primario"
                    disabled={pendente}
                    onClick={() => (confirmando.acao === "ativar" ? ativar(c.id) : excluir(c.id))}
                  >
                    {pendente ? "Aguarde..." : confirmando.acao === "ativar" ? "Ativar agora" : "Excluir"}
                  </Button>
                  <Button type="button" variante="contorno" onClick={() => setConfirmando(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {!estado.contas.length && !form && (
          <p className="corpo-suave px-5 py-12 text-center">
            Nenhuma conta cadastrada. Clique em “Nova conta” pra cadastrar a instituição de pagamento.
          </p>
        )}
      </div>

      {/* ---- formulário ---- */}
      {form && inst && (
        <div className={`${card} p-5`}>
          <p className="m-0 mb-4 text-[15px] font-semibold text-tinta">
            {form.id ? "Editar conta" : "Nova conta de pagamento"}
          </p>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_180px_160px]">
              <div>
                <label className={label}>Apelido</label>
                <input
                  className={field}
                  value={form.labelConta}
                  onChange={(e) => set("labelConta", e.target.value)}
                  placeholder="MP Elleva — produção"
                />
              </div>
              <div>
                <label className={label}>Instituição</label>
                <select className={field} value={form.provider} onChange={(e) => set("provider", e.target.value)}>
                  {estado.instituicoes.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.rotulo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Ambiente</label>
                <select
                  className={field}
                  value={form.environment}
                  onChange={(e) => set("environment", e.target.value as "sandbox" | "production")}
                >
                  <option value="production">Produção</option>
                  <option value="sandbox">Sandbox</option>
                </select>
              </div>
            </div>

            <div>
              <label className={label}>{inst.campos.accessToken}</label>
              <input
                className={`${field} font-mono text-[14px]`}
                type="password"
                autoComplete="off"
                value={form.accessToken}
                onChange={(e) => set("accessToken", e.target.value)}
                placeholder={form.id ? "deixe vazio pra manter o token atual" : "APP_USR-..."}
              />
              <p className="corpo-suave m-0 mt-1.5">{inst.ajuda}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>{inst.campos.publicKey}</label>
                <input
                  className={`${field} font-mono text-[14px]`}
                  value={form.publicKey}
                  onChange={(e) => set("publicKey", e.target.value)}
                  placeholder="APP_USR-0000-0000..."
                />
                <p className="corpo-suave m-0 mt-1.5">
                  Usada pelo navegador pra tokenizar o cartão. Precisa ser da MESMA conta do access token.
                </p>
              </div>
              <div>
                <label className={label}>{inst.campos.webhookSecret}</label>
                <input
                  className={`${field} font-mono text-[14px]`}
                  type="password"
                  autoComplete="off"
                  value={form.webhookSecret}
                  onChange={(e) => set("webhookSecret", e.target.value)}
                  placeholder={form.id ? "deixe vazio pra manter" : "assinatura secreta do webhook"}
                />
                <p className="corpo-suave m-0 mt-1.5">
                  Sem ela o webhook aceita qualquer chamada. Pegue no mesmo lugar das credenciais.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variante="primario" onClick={salvar} disabled={pendente}>
                {form.id ? "Salvar alterações" : "Cadastrar conta"}
              </Button>
              <Button type="button" variante="contorno" onClick={() => setForm(null)} disabled={pendente}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
