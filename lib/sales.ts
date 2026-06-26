const dayKey = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);

export interface Point {
  label: string;
  value: number;
}

/** Soma `amount` por dia nos últimos `n` dias (America/Sao_Paulo). */
export function lastNDays(rows: { date: string; amount: number }[], n = 14): Point[] {
  const today = new Date();
  const days: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const key = dayKey(d);
    const [, m, da] = key.split("-");
    days.push({ key, label: `${da}/${m}` });
  }
  const sums: Record<string, number> = {};
  for (const r of rows) {
    const key = dayKey(new Date(r.date));
    sums[key] = (sums[key] ?? 0) + r.amount;
  }
  return days.map((d) => ({ label: d.label, value: sums[d.key] ?? 0 }));
}
