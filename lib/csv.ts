// Exportação CSV (client-side) com BOM pra abrir certo no Excel pt-BR.
export function downloadCsv(filename: string, head: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "﻿" + [head.map(esc).join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** número no formato brasileiro pra planilha (1234.5 → "1234,50") */
export function csvNum(v: number): string {
  return Number(v).toFixed(2).replace(".", ",");
}

export function csvDate(iso?: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "";
}
