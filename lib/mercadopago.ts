import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago";

/** Retorna o client de Payment do Mercado Pago, ou null se não houver token
 *  configurado (modo mock — pagamento aprovado direto). */
export function getMpPayment(): Payment | null {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  const client = new MercadoPagoConfig({
    accessToken: token,
    options: { timeout: 8000 },
  });
  return new Payment(client);
}

export function getMpRefund(): PaymentRefund | null {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  const client = new MercadoPagoConfig({ accessToken: token, options: { timeout: 8000 } });
  return new PaymentRefund(client);
}

export const hasMercadoPago = () => !!process.env.MP_ACCESS_TOKEN;
