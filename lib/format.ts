export function fmtBRL(value: number): string {
  return "R$ " + Number(value).toLocaleString("pt-BR");
}
