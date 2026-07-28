// Taxa de serviço da Elleva — paga pelo comprador, sobre o preço do lote.
// O percentual é por evento (events.service_fee_pct): padrão 10%, definido
// pela Elleva (admin) e ajustável em negociação com o produtor.

export const DEFAULT_FEE_PCT = 10;

/** arredonda a centavos */
export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** taxa de UMA unidade do lote, exata em centavos (ex.: 59,90 a 10% → 5,99) */
export function feeUnit(price: number, pct: number): number {
  return Math.round(price * pct) / 100;
}

/** taxa total COBRADA do comprador (itens de evento que absorve a taxa não somam) */
export function feeOf(items: { price: number; qty: number; feePct: number; absorbFee?: boolean }[]): number {
  return round2(items.reduce((a, i) => a + (i.absorbFee ? 0 : feeUnit(i.price, i.feePct) * i.qty), 0));
}
