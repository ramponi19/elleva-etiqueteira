// Traduz erros do Mercado Pago (recusa OU validação de cartão) para mensagens
// claras em pt-BR. NUNCA devolve o texto cru do gateway ao comprador — o detalhe
// original fica só no log do servidor. Fonte: docs "status_detail" + erros de API.

// Recusas por status_detail (pagamento processado e negado pelo emissor).
const RECUSA: Record<string, string> = {
  cc_rejected_insufficient_amount: "Cartão sem limite/saldo suficiente para esta compra.",
  cc_rejected_bad_filled_card_number: "Número do cartão incorreto. Confira e tente de novo.",
  cc_rejected_bad_filled_date: "Data de validade incorreta.",
  cc_rejected_bad_filled_security_code: "Código de segurança (CVV) incorreto.",
  cc_rejected_bad_filled_other: "Algum dado do cartão está incorreto. Confira os campos.",
  cc_rejected_call_for_authorize: "Autorize esta compra com o banco emissor do cartão e tente novamente.",
  cc_rejected_card_disabled: "Cartão desativado. Fale com o banco emissor.",
  cc_rejected_card_error: "Não foi possível processar o cartão. Tente novamente em instantes.",
  cc_rejected_duplicated_payment: "Pagamento duplicado — parece que essa compra já foi feita.",
  cc_rejected_high_risk: "Pagamento não autorizado. Tente outro cartão ou forma de pagamento.",
  cc_rejected_blacklist: "Pagamento não autorizado. Tente outro cartão.",
  cc_rejected_invalid_installments: "Este cartão não aceita esse número de parcelas.",
  cc_rejected_max_attempts: "Muitas tentativas. Aguarde um pouco ou use outro cartão.",
  cc_rejected_other_reason: "Pagamento recusado pelo banco emissor. Tente outro cartão.",
};

// Erros de validação da API (dados do cartão malformados, antes de cobrar).
// Casados por palavra-chave no texto do erro (que vem em inglês do gateway).
const VALIDACAO: { match: RegExp; msg: string }[] = [
  { match: /card_?number|bin|invalid card/i, msg: "Número do cartão inválido. Confira os dígitos." },
  { match: /expiration|validade/i, msg: "Data de validade do cartão inválida." },
  { match: /security_?code|cvv|cvc/i, msg: "Código de segurança (CVV) inválido." },
  { match: /installment|parcel/i, msg: "Número de parcelas inválido para este cartão." },
  { match: /(payer\.)?email/i, msg: "E-mail inválido. Confira o endereço informado." },
  { match: /identification|document|cpf/i, msg: "CPF inválido. Confira os números." },
  { match: /amount|transaction_amount/i, msg: "Valor da compra inválido. Recarregue a página e tente de novo." },
  { match: /token/i, msg: "Não foi possível validar o cartão. Recarregue a página e tente de novo." },
  { match: /cardholder|holder|name/i, msg: "Nome no cartão inválido. Digite como está impresso." },
];

const GENERICO = "Não foi possível processar o cartão. Confira os dados e tente novamente, ou use outro cartão.";

/** Mensagem pt-BR para QUALQUER erro de cartão do MP (recusa ou validação). */
export function mpErrorMessage(detail?: string): string {
  if (!detail) return GENERICO;
  if (RECUSA[detail]) return RECUSA[detail];
  for (const v of VALIDACAO) if (v.match.test(detail)) return v.msg;
  return GENERICO;
}

/** Compat: recusa por status_detail (mantido para o ramo "rejected"). */
export function mpDeclineMessage(detail?: string): string {
  return mpErrorMessage(detail);
}
