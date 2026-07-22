// ============================================================
// Seleção do provedor de pagamento (plugável via PAYMENT_PROVIDER)
// ============================================================
import { mercadoPagoProvider } from "./mercadopago";
import type { PaymentProvider } from "./types";

// Para adicionar uma instituição: implemente o adaptador em ./<nome>.ts
// e registre aqui. Trocar em produção = setar PAYMENT_PROVIDER=<nome>.
const PROVIDERS: Record<string, PaymentProvider> = {
  mercadopago: mercadoPagoProvider,
};

const DEFAULT_PROVIDER = "mercadopago";

/** Provedor ativo (segundo a env PAYMENT_PROVIDER; padrão Mercado Pago). */
export function getPaymentProvider(): PaymentProvider {
  const id = process.env.PAYMENT_PROVIDER || DEFAULT_PROVIDER;
  return PROVIDERS[id] ?? mercadoPagoProvider;
}

export type { PaymentProvider } from "./types";
