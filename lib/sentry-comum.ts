/**
 * Configuração compartilhada do Sentry (navegador, servidor e edge).
 *
 * POR QUE ESTE ARQUIVO EXISTE: a Elleva processa CPF, nome e e-mail de
 * comprador, código Pix, token de cartão e QR de ingresso. Relatório de erro que
 * carrega isso pra fora vira um problema maior do que o erro. As decisões de
 * privacidade ficam num lugar só, pra os três ambientes não divergirem.
 */
import type { ErrorEvent } from "@sentry/nextjs";

/**
 * DSN do projeto no Sentry (org ramponi19).
 *
 * Vem de env pra não travar o deploy caso o projeto ainda não exista; quando a
 * variável está vazia o SDK fica INERTE (nada é enviado), em vez de quebrar.
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

/**
 * Só reporta em produção. Em `npm run dev` cada erro de digitação viraria
 * alerta, e o ruído treina a gente a ignorar o painel — o jeito mais rápido de
 * tornar o Sentry inútil. `NEXT_PUBLIC_SENTRY_DEV=1` liga localmente pra testar.
 */
export const sentryLigado =
  SENTRY_DSN.length > 0 &&
  (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SENTRY_DEV === "1");

/** CPF (com ou sem pontuação) e sequências longas de dígitos (cartão/Pix). */
const CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CARTAO = /\b\d{13,19}\b/g;
/** Pix copia-e-cola começa com o payload EMV "000201..." e é enorme. */
const PIX = /\b000201[0-9A-Za-z.*\-$%+/:]{30,}/g;
/** E-mail do comprador (M-4): pode aparecer cru em erro de SMTP/validação. */
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/** Remove dado sensível de qualquer texto que vá pro relatório. */
export function limpar(texto: string): string {
  return texto
    .replace(CPF, "[cpf]")
    .replace(PIX, "[pix]")
    .replace(CARTAO, "[numero]")
    .replace(EMAIL, "[email]");
}

/**
 * Preview e produção rodam com NODE_ENV=production na Vercel, então usar
 * NODE_ENV aqui jogaria erro de branch de teste no mesmo balde do erro de
 * cliente real. VERCEL_ENV separa ("production" | "preview"); a variante
 * NEXT_PUBLIC_ é a que chega no navegador.
 */
const AMBIENTE =
  process.env.NEXT_PUBLIC_VERCEL_ENV ??
  process.env.VERCEL_ENV ??
  process.env.NODE_ENV;

export const opcoesComuns = {
  dsn: SENTRY_DSN,
  environment: AMBIENTE,

  // NÃO enviar dado pessoal: sem isto o SDK anexa cabeçalhos, cookies e IP —
  // aqui isso significaria mandar sessão de comprador e CPF pra um terceiro.
  sendDefaultPii: false,

  // Erros, não performance: o volume é de bilheteria regional e trace amostrado
  // só consome cota. Erro amostrado é erro que talvez você nunca veja.
  tracesSampleRate: 0,
  sampleRate: 1,

  /** Última barreira antes de sair da máquina. */
  beforeSend(evento: ErrorEvent) {
    const req = evento.request;
    if (req) {
      // corpo de requisição do checkout carrega CPF, e-mail e token do cartão
      delete req.data;
      delete req.cookies;
      if (req.headers) {
        delete req.headers.authorization;
        delete req.headers.cookie;
      }
      if (req.query_string) req.query_string = undefined;
      if (typeof req.url === "string") req.url = limpar(req.url);
    }
    // mensagem e trilha também podem carregar CPF/código (ex.: "CPF 123... inválido")
    for (const ex of evento.exception?.values ?? []) {
      if (ex.value) ex.value = limpar(ex.value);
    }
    if (evento.message) evento.message = limpar(evento.message);
    for (const b of evento.breadcrumbs ?? []) {
      if (b.message) b.message = limpar(b.message);
      delete b.data;
    }
    return evento;
  },

  /** Não é defeito nosso e só faria barulho no painel. */
  ignoreErrors: [
    "ResizeObserver loop",
    "AbortError",
    "NetworkError when attempting to fetch resource",
    "Failed to fetch",
    "Load failed",
    // o scanner de QR reclama quando a pessoa nega a câmera na portaria
    "NotAllowedError",
    "Permission denied",
    /extension\//i,
    /^chrome-extension:/,
    /^moz-extension:/,
  ],
};
