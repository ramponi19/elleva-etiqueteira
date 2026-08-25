// Allowlist dos IDs de rastreamento (C2). Esses valores viram texto CRU dentro
// de um <script> na página pública — só passa quem bate o formato exato. Fonte
// única para o servidor (validação no schema) e o render (event-tracking).
export const META_PIXEL_RE = /^\d{8,20}$/;
export const GA_ID_RE = /^(G|UA|AW|GT)-[A-Za-z0-9-]{4,20}$/;

/** Devolve o ID se válido, senão null (nunca deixa passar aspa, parêntese, `<`). */
export function safeMetaPixel(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s && META_PIXEL_RE.test(s) ? s : null;
}
export function safeGaId(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s && GA_ID_RE.test(s) ? s : null;
}
