"use client";

/**
 * Chamada de Server Action a partir do cliente, resiliente a "deploy skew".
 *
 * Quando a aba ficou aberta com um build antigo (Safari do iPhone restaura abas
 * de dias atrás), o ID da action não existe mais no servidor e o Next responde
 * "Failed to find Server Action" (Sentry ELLEVA-TICKETS-6). Sem tratamento, a
 * promise rejeita e o botão fica preso em "Aguarde...". Aqui: detecta o caso,
 * avisa e recarrega a página UMA vez (o build novo resolve). Outros erros
 * viram uma mensagem amigável em vez de exceção solta.
 */
export type ActionFalha = { ok: false; error: string };

const SKEW_RE = /Failed to find Server Action|older or newer deployment|Server Action .* was not found/i;
const RELOAD_KEY = "elleva_skew_reload";

export const MSG_DESATUALIZADA = "Sua página estava desatualizada. Recarregando…";
export const MSG_FALHA = "Não foi possível concluir agora. Tente de novo em instantes.";

export function isDeploySkew(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e ?? "");
  return SKEW_RE.test(msg);
}

/** Recarrega uma única vez por sessão pra não entrar em loop se o servidor seguir recusando. */
function recarregarUmaVez(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === "1") return false;
    sessionStorage.setItem(RELOAD_KEY, "1");
  } catch {
    /* sem storage: recarrega mesmo assim */
  }
  setTimeout(() => window.location.reload(), 600);
  return true;
}

/**
 * Executa `fn` (uma Server Action). Nunca lança: em falha devolve `{ok:false,error}`.
 * O chamador decide o que fazer com `error` (mostrar na tela). Em deploy skew,
 * a mensagem é a de "desatualizada" e a página recarrega sozinha.
 */
export async function chamarAction<T>(fn: () => Promise<T>): Promise<T | ActionFalha> {
  try {
    return await fn();
  } catch (e) {
    if (isDeploySkew(e)) {
      const vai = recarregarUmaVez();
      return { ok: false, error: vai ? MSG_DESATUALIZADA : "Sua página está desatualizada. Recarregue para continuar." };
    }
    return { ok: false, error: MSG_FALHA };
  }
}

/** Limpa o marcador após um reload bem-sucedido (chamar num efeito de montagem). */
export function limparMarcaSkew() {
  try {
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    /* ignore */
  }
}
