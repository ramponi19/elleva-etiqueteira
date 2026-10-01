// Destino depois do login (?next=). Só caminho interno: "?next=@evil.com" viraria
// https://dominio@evil.com e "//evil.com" é outro site (open redirect/phishing).
export function destinoSeguro(next: string | null | undefined, padrao = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return padrao;
  return next;
}
