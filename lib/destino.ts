// Destino depois do login (?next=). Só caminho interno do próprio site.
//
// A checagem não pode ser só por prefixo de texto: o parser de URL do navegador
// descarta TAB/CR/LF e trata "\" como "/" antes de interpretar, então um texto
// que "começa com uma barra só" ainda pode virar outro domínio. Por isso: recusa
// caractere de controle e barra invertida, e confere o RESULTADO do parser
// (mesma origem) em vez do texto cru.
const BASE = "https://destino.invalid";
const PROIBIDOS = /[\u0000-\u001F\u007F\\]/;

export function destinoSeguro(next: string | null | undefined, padrao = "/"): string {
  if (!next || PROIBIDOS.test(next)) return padrao;
  if (!next.startsWith("/") || next.startsWith("//")) return padrao;
  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return padrao;
  }
  if (url.origin !== BASE) return padrao;
  return url.pathname + url.search + url.hash;
}
