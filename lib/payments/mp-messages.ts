// Traduz o status_detail do Mercado Pago (recusa de cartão) para uma mensagem
// clara em pt-BR, acionável pelo comprador. Fonte: docs "status and status_detail".
const MAP: Record<string, string> = {
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

export function mpDeclineMessage(detail?: string): string {
  if (detail && MAP[detail]) return MAP[detail];
  return "Pagamento recusado. Confira os dados do cartão ou tente outro.";
}
