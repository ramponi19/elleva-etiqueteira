"use server";

// ============================================================
// Contas de pagamento — cadastro pelo /admin (migration 0062)
// ============================================================
// Regras que valem pra TODA action daqui:
//   - só `admin` entra (a Elleva);
//   - segredo NUNCA volta pro cliente: a tela recebe só a máscara;
//   - segredo NUNCA vai pro audit_log (só o que mudou, não o valor);
//   - ativar exige que o token responda no gateway agora — ativar uma conta
//     com token errado é derrubar o checkout inteiro.
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { cifrar, decifrar, mascarar, cifraPronta, COMANDO_GERAR_CHAVE } from "@/lib/secrets";
import { INSTITUICOES, type InstituicaoId } from "@/lib/payments";
import { verificarContaMercadoPago } from "@/lib/payments/mercadopago";
import { credenciaisAtivas } from "@/lib/payments/accounts";

export interface ContaPagamentoView {
  id: string;
  provider: string;
  providerRotulo: string;
  label: string;
  environment: "sandbox" | "production";
  active: boolean;
  /** máscaras — nunca o valor */
  accessTokenMask: string | null;
  temWebhookSecret: boolean;
  publicKey: string | null;
  lastCheckAt: string | null;
  lastCheckOk: boolean | null;
  lastCheckInfo: string | null;
  updatedAt: string;
}

export interface Instituicao {
  id: string;
  rotulo: string;
  campos: { accessToken: string; publicKey: string; webhookSecret: string };
  ajuda: string;
}

export interface EstadoPagamentos {
  contas: ContaPagamentoView[];
  /** de onde o checkout está tirando credencial AGORA */
  fonte: "banco" | "env" | "nenhuma";
  fonteLabel: string | null;
  cifraPronta: boolean;
  comandoChave: string;
  instituicoes: Instituicao[];
}

async function exigirAdmin() {
  const { role } = await getAuth();
  if (role !== "admin") return null;
  return await createServiceClient();
}

export async function carregarPagamentos(): Promise<EstadoPagamentos | { erro: string }> {
  const svc = await exigirAdmin();
  if (!svc) return { erro: "Sem permissão." };

  const { data } = await svc
    .from("payment_accounts")
    .select("*")
    .order("active", { ascending: false })
    .order("created_at", { ascending: false });

  const ativa = await credenciaisAtivas();

  return {
    contas: (data ?? []).map(
      (c): ContaPagamentoView => ({
        id: String(c.id),
        provider: String(c.provider),
        providerRotulo: INSTITUICOES[c.provider as InstituicaoId]?.rotulo ?? String(c.provider),
        label: String(c.label),
        environment: c.environment === "sandbox" ? "sandbox" : "production",
        active: !!c.active,
        accessTokenMask: mascarar(decifrar(c.access_token_enc as string | null)),
        temWebhookSecret: !!decifrar(c.webhook_secret_enc as string | null),
        publicKey: (c.public_key as string | null) ?? null,
        lastCheckAt: (c.last_check_at as string | null) ?? null,
        lastCheckOk: (c.last_check_ok as boolean | null) ?? null,
        lastCheckInfo: (c.last_check_info as string | null) ?? null,
        updatedAt: String(c.updated_at),
      })
    ),
    fonte: ativa.fonte,
    fonteLabel: ativa.label,
    cifraPronta: cifraPronta(),
    comandoChave: COMANDO_GERAR_CHAVE,
    instituicoes: Object.entries(INSTITUICOES).map(([id, i]) => ({
      id,
      rotulo: i.rotulo,
      campos: i.campos,
      ajuda: i.ajuda,
    })),
  };
}

export interface EntradaConta {
  id?: string;
  provider: string;
  label: string;
  environment: "sandbox" | "production";
  /** vazio na edição = mantém o segredo que já está salvo */
  accessToken?: string;
  webhookSecret?: string;
  publicKey?: string;
}

/** Access token de teste em conta marcada como produção (e vice-versa) é o erro
 *  que faz "vender" sem dinheiro entrar. Barra na porta. */
function conferirAmbiente(provider: string, token: string, env: "sandbox" | "production"): string | null {
  if (provider !== "mercadopago" || !token) return null;
  const teste = token.startsWith("TEST-");
  if (teste && env === "production") {
    return "Esse access token é de TESTE (começa com TEST-), mas a conta está marcada como Produção. Troque o ambiente para Sandbox ou cole a credencial de produção.";
  }
  if (!teste && env === "sandbox" && token.startsWith("APP_USR-")) {
    return "Esse access token é de PRODUÇÃO (APP_USR-), mas a conta está marcada como Sandbox. Cobranças reais cairiam nessa conta.";
  }
  return null;
}

export async function salvarConta(
  entrada: EntradaConta
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const svc = await exigirAdmin();
  if (!svc) return { ok: false, error: "Sem permissão." };

  const inst = INSTITUICOES[entrada.provider as InstituicaoId];
  if (!inst) return { ok: false, error: "Instituição não suportada." };

  const label = entrada.label.trim();
  if (!label) return { ok: false, error: "Dê um apelido pra conta (ex.: MP Elleva — produção)." };
  const env = entrada.environment === "sandbox" ? "sandbox" : "production";

  const token = entrada.accessToken?.trim() || "";
  const segredo = entrada.webhookSecret?.trim() || "";
  const publica = entrada.publicKey?.trim() || null;

  if ((token || segredo) && !cifraPronta()) {
    return {
      ok: false,
      error:
        "SETTINGS_ENC_KEY não está configurada — sem ela o token não pode ser guardado em segurança. Gere a chave e coloque na Vercel antes de salvar.",
    };
  }

  const meuId = (await getAuth()).user?.id ?? null;
  const campos: Record<string, unknown> = {
    provider: entrada.provider,
    label,
    environment: env,
    public_key: publica,
    updated_at: new Date().toISOString(),
    updated_by: meuId,
  };
  if (token) campos.access_token_enc = cifrar(token);
  if (segredo) campos.webhook_secret_enc = cifrar(segredo);

  if (entrada.id) {
    // Na edição o token pode vir vazio (= não mexer). Nesse caso o ambiente é
    // conferido contra o token JÁ salvo, senão dava pra transformar uma conta
    // de teste em "produção" só mudando o select.
    const { data: atual } = await svc
      .from("payment_accounts")
      .select("access_token_enc, active")
      .eq("id", entrada.id)
      .maybeSingle();
    if (!atual) return { ok: false, error: "Conta não encontrada." };

    const efetivo = token || decifrar(atual.access_token_enc as string | null) || "";
    const problema = conferirAmbiente(entrada.provider, efetivo, env);
    if (problema) return { ok: false, error: problema };

    const { error } = await svc.from("payment_accounts").update(campos).eq("id", entrada.id);
    if (error) return { ok: false, error: error.message };

    await audit("payment_account_updated", entrada.id, {
      label,
      provider: entrada.provider,
      environment: env,
      trocou_access_token: !!token,
      trocou_webhook_secret: !!segredo,
      estava_ativa: !!atual.active,
    });
    revalidatePath("/admin/pagamentos");
    return { ok: true, id: entrada.id };
  }

  if (!token) return { ok: false, error: `Cole o ${inst.campos.accessToken} da conta.` };
  const problema = conferirAmbiente(entrada.provider, token, env);
  if (problema) return { ok: false, error: problema };

  campos.created_by = meuId;
  campos.active = false; // nunca nasce valendo: ativar é um clique explícito

  const { data, error } = await svc.from("payment_accounts").insert(campos).select("id").single();
  if (error) return { ok: false, error: error.message };

  await audit("payment_account_created", String(data.id), {
    label,
    provider: entrada.provider,
    environment: env,
  });
  revalidatePath("/admin/pagamentos");
  return { ok: true, id: String(data.id) };
}

/** Pergunta ao gateway de quem é o token e guarda a resposta na linha. */
export async function testarConta(id: string): Promise<{ ok: boolean; info: string }> {
  const svc = await exigirAdmin();
  if (!svc) return { ok: false, info: "Sem permissão." };

  const { data } = await svc
    .from("payment_accounts")
    .select("provider, access_token_enc")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { ok: false, info: "Conta não encontrada." };

  const token = decifrar(data.access_token_enc as string | null);
  if (!token) {
    return {
      ok: false,
      info: "Não foi possível decifrar o token guardado. Se a SETTINGS_ENC_KEY mudou, cole a credencial de novo.",
    };
  }

  const r =
    data.provider === "mercadopago"
      ? await verificarContaMercadoPago(token)
      : { ok: false, info: "Teste de conexão ainda não implementado para essa instituição." };

  await svc
    .from("payment_accounts")
    .update({ last_check_at: new Date().toISOString(), last_check_ok: r.ok, last_check_info: r.info })
    .eq("id", id);
  revalidatePath("/admin/pagamentos");
  return r;
}

/** Passa a cobrar nesta conta. Só depois de o gateway confirmar o token. */
export async function ativarConta(id: string): Promise<{ ok: boolean; error?: string; info?: string }> {
  const svc = await exigirAdmin();
  if (!svc) return { ok: false, error: "Sem permissão." };

  const teste = await testarConta(id);
  if (!teste.ok) {
    return { ok: false, error: `O gateway não aceitou essa credencial, então ela NÃO foi ativada. ${teste.info}` };
  }

  const { data: conta } = await svc
    .from("payment_accounts")
    .select("label, environment")
    .eq("id", id)
    .maybeSingle();
  if (!conta) return { ok: false, error: "Conta não encontrada." };

  // Desliga TODAS antes de ligar a escolhida: o índice único parcial
  // (payment_accounts_um_ativo) rejeita duas ativas, então a ordem importa.
  const { error: e1 } = await svc.from("payment_accounts").update({ active: false }).eq("active", true);
  if (e1) return { ok: false, error: e1.message };
  const { error: e2 } = await svc.from("payment_accounts").update({ active: true }).eq("id", id);
  if (e2) return { ok: false, error: e2.message };

  await audit("payment_account_activated", id, {
    label: conta.label,
    environment: conta.environment,
    gateway: teste.info,
  });
  revalidatePath("/admin/pagamentos");
  return { ok: true, info: teste.info };
}

/** Volta a usar as variáveis de ambiente (escape hatch). */
export async function desativarTodas(): Promise<{ ok: boolean; error?: string }> {
  const svc = await exigirAdmin();
  if (!svc) return { ok: false, error: "Sem permissão." };

  const { error } = await svc.from("payment_accounts").update({ active: false }).eq("active", true);
  if (error) return { ok: false, error: error.message };

  await audit("payment_account_deactivated", null, {});
  revalidatePath("/admin/pagamentos");
  return { ok: true };
}

export async function excluirConta(id: string): Promise<{ ok: boolean; error?: string }> {
  const svc = await exigirAdmin();
  if (!svc) return { ok: false, error: "Sem permissão." };

  const { data: conta } = await svc
    .from("payment_accounts")
    .select("label, active")
    .eq("id", id)
    .maybeSingle();
  if (!conta) return { ok: false, error: "Conta não encontrada." };
  // Apagar a conta ativa é derrubar o checkout no meio do dia.
  if (conta.active) {
    return { ok: false, error: "Essa é a conta ativa. Ative outra (ou desative o cadastro) antes de excluir." };
  }

  const { error } = await svc.from("payment_accounts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await audit("payment_account_deleted", id, { label: conta.label });
  revalidatePath("/admin/pagamentos");
  return { ok: true };
}
