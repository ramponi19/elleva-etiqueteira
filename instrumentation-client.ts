import * as Sentry from "@sentry/nextjs";
import { opcoesComuns, sentryLigado } from "@/lib/sentry-comum";

/**
 * Sentry no NAVEGADOR — onde moram os erros que o comprador e o produtor vivem.
 *
 * É o caso do "não consigo finalizar a compra" e do "a portaria travou": até
 * agora só chegava até nós se alguém contasse. Isto existe pra próxima vez
 * chegar sozinho, com linha, navegador e rota.
 *
 * SEM Session Replay de propósito: gravar a tela aqui é gravar CPF no checkout
 * e o QR do ingresso na portaria.
 */
if (sentryLigado) {
  Sentry.init({
    ...opcoesComuns,
    integrations: [],
  });
}

/** Instrumenta as trocas de rota do App Router (exigido pelo SDK). */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
