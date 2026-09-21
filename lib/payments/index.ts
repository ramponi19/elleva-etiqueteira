// ============================================================
// Seleção do provedor de pagamento (a conta ativa manda)
// ============================================================
import { criarProvedorMercadoPago } from "./mercadopago";
import { credenciaisAtivas } from "./accounts";
import type { PaymentProvider, ProviderCredentials } from "./types";

/** Catálogo de instituições suportadas. Para adicionar uma: implemente o
 *  adaptador em ./<nome>.ts e registre aqui — a opção aparece sozinha no
 *  seletor de /admin/pagamentos. */
export const INSTITUICOES = {
  mercadopago: {
    rotulo: "Mercado Pago",
    /** rótulos dos campos que essa instituição pede, pra tela não ficar genérica */
    campos: {
      accessToken: "Access token",
      publicKey: "Public key",
      webhookSecret: "Assinatura do webhook",
    },
    ajuda: "Mercado Pago → Seu negócio → Configurações → Gestão e administração → Credenciais.",
    criar: criarProvedorMercadoPago,
  },
} satisfies Record<
  string,
  {
    rotulo: string;
    campos: { accessToken: string; publicKey: string; webhookSecret: string };
    ajuda: string;
    criar: (creds: ProviderCredentials) => PaymentProvider;
  }
>;

export type InstituicaoId = keyof typeof INSTITUICOES;

const PADRAO: InstituicaoId = "mercadopago";

/** Provedor amarrado a credenciais específicas (usado pelo "testar conexão"). */
export function provedorDe(id: string, creds: ProviderCredentials): PaymentProvider {
  const inst = INSTITUICOES[id as InstituicaoId] ?? INSTITUICOES[PADRAO];
  return inst.criar(creds);
}

/** Provedor ativo: conta cadastrada em /admin/pagamentos; na falta dela, as envs. */
export async function getPaymentProvider(): Promise<PaymentProvider> {
  const { providerId, creds } = await credenciaisAtivas();
  return provedorDe(providerId, creds);
}

export type { PaymentProvider, ProviderCredentials } from "./types";
export { credenciaisAtivas } from "./accounts";
