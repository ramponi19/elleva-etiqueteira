export function fmtBRL(value: number): string {
  return "R$ " + Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Máscara de telefone BR: (11) 99999-9999 (celular) ou (11) 3333-4444 (fixo). */
export function maskPhone(v: string): string {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return d.replace(/^(\d{2})(\d{0,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

/** Máscara de CEP: 00000-000. */
export function maskCEP(v: string): string {
  const d = (v || "").replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.replace(/^(\d{5})(\d{0,3})/, "$1-$2") : d;
}
