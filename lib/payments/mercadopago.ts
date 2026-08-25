// ============================================================
// Adaptador Mercado Pago (Pix transparente + cartão + reembolso + webhook)
// ============================================================
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago";
import { createHmac, timingSafeEqual } from "crypto";
import type {
  PaymentProvider,
  PixChargeInput,
  PixChargeResult,
  CardChargeInput,
  CardChargeResult,
  WebhookPayment,
} from "./types";

function config(): MercadoPagoConfig | null {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  return new MercadoPagoConfig({ accessToken: token, options: { timeout: 8000 } });
}

function cpfId(cpf?: string) {
  return cpf ? { type: "CPF", number: cpf.replace(/\D/g, "") } : undefined;
}

export const mercadoPagoProvider: PaymentProvider = {
  id: "mercadopago",

  isConfigured() {
    return !!process.env.MP_ACCESS_TOKEN;
  },

  async createPixCharge(input: PixChargeInput): Promise<PixChargeResult> {
    const c = config();
    if (!c) throw new Error("Mercado Pago não configurado.");
    const payment = await new Payment(c).create({
      body: {
        transaction_amount: input.amount,
        description: input.description,
        payment_method_id: "pix",
        date_of_expiration: input.expiration,
        external_reference: input.orderId,
        notification_url: input.notificationUrl,
        payer: {
          email: input.buyer.email,
          first_name: input.buyer.firstName,
          last_name: input.buyer.lastName || undefined,
          identification: cpfId(input.buyer.cpf),
        },
      },
    });
    const tx = payment.point_of_interaction?.transaction_data;
    return {
      paymentId: String(payment.id),
      qrBase64: tx?.qr_code_base64 ?? "",
      copyPaste: tx?.qr_code ?? "",
    };
  },

  async createCardCharge(input: CardChargeInput): Promise<CardChargeResult> {
    const c = config();
    if (!c) throw new Error("Mercado Pago não configurado.");
    const payment = await new Payment(c).create({
      body: {
        transaction_amount: input.amount,
        token: input.token,
        payment_method_id: input.paymentMethodId,
        installments: input.installments,
        description: input.description,
        external_reference: input.orderId,
        notification_url: input.notificationUrl,
        payer: {
          email: input.buyer.email,
          identification: cpfId(input.buyer.cpf),
        },
      },
    });
    const raw = payment.status;
    const status =
      raw === "approved" ? "approved" : raw === "in_process" || raw === "pending" ? "pending" : "rejected";
    return { paymentId: String(payment.id), status, detail: payment.status_detail ?? undefined };
  },

  async refund(paymentId: string): Promise<void> {
    const c = config();
    if (!c) return;
    await new PaymentRefund(c).create({ payment_id: paymentId });
  },

  // Manifesto: id:<data.id>;request-id:<x-request-id>;ts:<ts>; → HMAC-SHA256(secret)
  verifyWebhookSignature(request: Request, dataId: string | null): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      // Sem secret não dá pra validar origem. Em produção isso é uma brecha —
      // avisa alto no log. (Não bloqueamos aqui pra não derrubar a confirmação
      // do Pix caso o secret ainda não tenha sido configurado; setar o
      // MP_WEBHOOK_SECRET fecha a verificação automaticamente.)
      if (process.env.NODE_ENV === "production") {
        console.warn("[webhook] MP_WEBHOOK_SECRET ausente — webhook sem verificação de assinatura. Configure o secret.");
      }
      return true;
    }

    const sigHeader = request.headers.get("x-signature");
    const requestId = request.headers.get("x-request-id");
    if (!sigHeader || !dataId) return false;

    const parts = Object.fromEntries(
      sigHeader.split(",").map((kv) => {
        const [k, v] = kv.split("=");
        return [k?.trim(), v?.trim()];
      })
    );
    const ts = parts["ts"];
    const v1 = parts["v1"];
    if (!ts || !v1) return false;

    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
    const expected = createHmac("sha256", secret).update(manifest).digest("hex");
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(v1, "hex");
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },

  async fetchWebhookPayment(paymentId: string): Promise<WebhookPayment | null> {
    const c = config();
    if (!c) return null;
    const payment = await new Payment(c).get({ id: paymentId });
    const raw = payment.status;
    // `refunded` = estorno total; `charged_back` = chargeback (disputa no cartão).
    // Antes ambos caíam em "other" e o webhook IGNORAVA — o dinheiro voltava pro
    // comprador mas o pedido seguia "paid": ingresso válido e venda contando no
    // saldo do produtor. Agora viram "refunded" e o pedido é revertido.
    const status =
      raw === "approved" ? "approved"
      : raw === "refunded" || raw === "charged_back" ? "refunded"
      : raw === "cancelled" ? "cancelled"
      : raw === "rejected" ? "rejected"
      : "other";
    return { orderId: payment.external_reference ?? null, status };
  },
};
