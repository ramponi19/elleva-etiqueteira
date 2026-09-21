// ============================================================
// De onde saem as credenciais do gateway (banco → senão env).
// ============================================================
// Fonte da verdade: a linha ativa de public.payment_accounts (migration 0062),
// cadastrada em /admin/pagamentos. Se NÃO houver conta ativa, cai nas envs
// antigas (MP_ACCESS_TOKEN & cia.) — é o que mantém a produção de pé enquanto
// a primeira conta não foi cadastrada, e serve de escape hatch se alguém
// desativar tudo por engano.
//
// Sem cache de propósito: é uma query indexada de uma linha, irrelevante ao
// lado da chamada HTTP ao gateway que vem depois — e cache aqui significaria
// continuar cobrando na conta ANTIGA por alguns segundos depois de trocar, ou
// recusar webhooks com o segredo velho durante uma rotação.
import { createServiceClient } from "@/lib/supabase/server";
import { decifrar } from "@/lib/secrets";
import type { ProviderCredentials } from "./types";

export type FonteCredencial = "banco" | "env" | "nenhuma";

export interface CredenciaisAtivas {
  providerId: string;
  creds: ProviderCredentials;
  fonte: FonteCredencial;
  /** apelido da conta (só quando vem do banco) — usado em log e na tela */
  label: string | null;
  accountId: string | null;
}

function doEnv(): CredenciaisAtivas {
  const accessToken = process.env.MP_ACCESS_TOKEN?.trim() || null;
  return {
    providerId: process.env.PAYMENT_PROVIDER || "mercadopago",
    creds: {
      accessToken,
      publicKey: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() || null,
      webhookSecret: process.env.MP_WEBHOOK_SECRET?.trim() || null,
      environment: accessToken?.startsWith("TEST-") ? "sandbox" : "production",
    },
    fonte: accessToken ? "env" : "nenhuma",
    label: null,
    accountId: null,
  };
}

/** Credenciais em vigor agora. Nunca lança: sem conta e sem env, devolve
 *  fonte "nenhuma" e o checkout segue pro modo mock como antes. */
export async function credenciaisAtivas(): Promise<CredenciaisAtivas> {
  try {
    const svc = await createServiceClient();
    const { data } = await svc
      .from("payment_accounts")
      .select("id, provider, label, environment, access_token_enc, webhook_secret_enc, public_key")
      .eq("active", true)
      .maybeSingle();

    if (!data) return doEnv();

    const accessToken = decifrar(data.access_token_enc as string | null);
    if (!accessToken) {
      // A conta existe mas o segredo não abriu: SETTINGS_ENC_KEY trocou ou o
      // valor foi adulterado. Cair calado na env seria cobrar na conta errada
      // sem ninguém notar — então avisa alto e devolve "sem credencial", o que
      // faz o checkout responder "pagamento indisponível" em vez de chutar.
      console.error(
        `[pagamentos] conta ativa "${data.label}" (${data.id}) não pôde ser decifrada — confira SETTINGS_ENC_KEY.`
      );
      return {
        providerId: String(data.provider),
        creds: { accessToken: null, publicKey: null, webhookSecret: null, environment: "production" },
        fonte: "nenhuma",
        label: String(data.label),
        accountId: String(data.id),
      };
    }

    return {
      providerId: String(data.provider),
      creds: {
        accessToken,
        publicKey: (data.public_key as string | null)?.trim() || null,
        webhookSecret: decifrar(data.webhook_secret_enc as string | null),
        environment: data.environment === "sandbox" ? "sandbox" : "production",
      },
      fonte: "banco",
      label: String(data.label),
      accountId: String(data.id),
    };
  } catch {
    // banco fora do ar / service key ausente → env é melhor que nada
    return doEnv();
  }
}
