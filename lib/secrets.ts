// ============================================================
// Cifra dos segredos que ficam no banco (tokens de gateway).
// ============================================================
// AES-256-GCM com chave em `SETTINGS_ENC_KEY` (env, nunca no banco): um dump
// do Postgres vazado não entrega o access token do Mercado Pago. GCM e não CBC
// porque autentica — se alguém com acesso ao banco editar o ciphertext na mão,
// o decrypt falha em vez de devolver lixo que viraria uma cobrança estranha.
//
// Formato guardado: "v1.<iv b64>.<tag b64>.<ciphertext b64>". O prefixo de
// versão existe pra permitir trocar de algoritmo depois sem adivinhar o que é
// cada linha.
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const VERSAO = "v1";

/** Chave de 32 bytes vinda da env (aceita base64 ou hex). */
function chave(): Buffer | null {
  const raw = process.env.SETTINGS_ENC_KEY?.trim();
  if (!raw) return null;
  const buf = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : null;
}

/** Dá pra cifrar? (chave presente e do tamanho certo) */
export function cifraPronta(): boolean {
  return chave() !== null;
}

/** Comando pronto pro Lucas gerar a chave. */
export const COMANDO_GERAR_CHAVE =
  'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"';

export function cifrar(texto: string): string {
  const k = chave();
  if (!k) throw new Error("SETTINGS_ENC_KEY ausente ou inválida (precisa de 32 bytes em base64 ou hex).");
  const iv = randomBytes(12);
  const c = createCipheriv(ALGO, k, iv);
  const ct = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [VERSAO, iv.toString("base64"), c.getAuthTag().toString("base64"), ct.toString("base64")].join(".");
}

/** Decifra; devolve null se a chave mudou, o dado foi adulterado ou o formato é outro. */
export function decifrar(guardado: string | null | undefined): string | null {
  if (!guardado) return null;
  const k = chave();
  if (!k) return null;
  const [v, ivB64, tagB64, ctB64] = guardado.split(".");
  if (v !== VERSAO || !ivB64 || !tagB64 || !ctB64) return null;
  try {
    const d = createDecipheriv(ALGO, k, Buffer.from(ivB64, "base64"));
    d.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([d.update(Buffer.from(ctB64, "base64")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** "APP_USR-1234…9f2a" — o que a tela mostra. Nunca o segredo inteiro. */
export function mascarar(segredo: string | null | undefined): string | null {
  if (!segredo) return null;
  const s = segredo.trim();
  if (s.length <= 12) return "•".repeat(s.length);
  // mantém o prefixo do MP (APP_USR- / TEST-), que é o que identifica o ambiente
  const hifen = s.indexOf("-");
  const prefixo = hifen > 0 && hifen <= 10 ? s.slice(0, hifen + 1) : s.slice(0, 4);
  return `${prefixo}${"•".repeat(8)}${s.slice(-4)}`;
}
