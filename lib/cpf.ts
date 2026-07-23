// Validação de CPF (dígitos verificadores) — client-safe, sem dependências.

export function onlyDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

/** true se o CPF é válido pelos dígitos verificadores (rejeita fake e sequências). */
export function isValidCPF(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // 000..., 111... etc.

  const digito = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += parseInt(base[i], 10) * (pesoInicial - i);
    const resto = 11 - (soma % 11);
    return resto >= 10 ? 0 : resto;
  };

  const d1 = digito(cpf.slice(0, 9), 10);
  if (d1 !== parseInt(cpf[9], 10)) return false;
  const d2 = digito(cpf.slice(0, 10), 11);
  if (d2 !== parseInt(cpf[10], 10)) return false;
  return true;
}

/** Formata como 000.000.000-00 (o que der; não valida). */
export function formatCPF(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}
