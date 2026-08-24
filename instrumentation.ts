import * as Sentry from "@sentry/nextjs";
import { opcoesComuns, sentryLigado } from "@/lib/sentry-comum";

/**
 * Sentry no SERVIDOR e no EDGE (middleware).
 *
 * Cobre o que o comprador nunca vê e a gente também não: exceção dentro de
 * server action (checkout, repasse, validação de ingresso), falha ao renderizar
 * página e erro no webhook do Mercado Pago. Hoje isso vira um 500 na tela e
 * nada em lugar nenhum — foi assim que "Falha ao processar o cartão" ficou
 * escondido até eu instrumentar na mão.
 */
export function register() {
  if (!sentryLigado) return;
  Sentry.init(opcoesComuns);
}

/**
 * Erro ao renderizar Server Component / rota. O Next chama isto sozinho — sem
 * este gancho, justamente as falhas de servidor ficariam de fora.
 */
export const onRequestError = Sentry.captureRequestError;
