// ============================================================
// Adaptador Mercado Pago (Pix transparente + cartão + reembolso + webhook)
// ============================================================
// O adaptador NÃO lê env nem banco: recebe as credenciais de quem o criou
// (lib/payments/index.ts → getPaymentProvider). É isso que permite trocar a
// conta da Elleva por um menu no /admin em vez de redeploy.
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago";
import { createHmac, timingSafeEqual } from "crypto";
import type {
  PaymentProvider,
  ProviderCredentials,
  PixChargeInput,
  PixChargeResult,
  CardChargeInput,
  CardChargeResult,
  WebhookPayment,
} from "./types";

function cpfId(cpf?: string) {
  return cpf ? { type: "CPF", number: cpf.replace(/\D/g, "") } : undefined;
}

/** Instancia o provedor amarrado a UMA conta do Mercado Pago. */
export function criarProvedorMercadoPago(creds: ProviderCredentials): PaymentProvider {
  const token = creds.accessToken?.trim() || null;

  function config(): MercadoPagoConfig | null {
    if (!token) return null;
    return new MercadoPagoConfig({ accessToken: token, options: { timeout: 8000 } });
  }

  return {
    id: "mercadopago",

    isConfigured() {
      return !!token;
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
      const secret = creds.webhookSecret?.trim() || null;
      if (!secret) {
        // Sem secret não dá pra validar origem. Em produção isso é uma brecha —
        // avisa alto no log. (Não bloqueamos aqui pra não derrubar a confirmação
        // do Pix caso o secret ainda não tenha sido configurado; salvar o
        // segredo do webhook em /admin/pagamentos fecha a verificação.)
        if (process.env.NODE_ENV === "production") {
          console.warn("[webhook] segredo do webhook ausente — webhook sem verificação de assinatura. Configure em /admin/pagamentos.");
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
}

/** "Testar conexão" da tela do admin: pergunta ao MP de quem é o token.
 *  É a prova de que a conta cadastrada é a que o admin acha que é. */
export async function verificarContaMercadoPago(
  accessToken: string
): Promise<{ ok: boolean; info: string }> {
  try {
    const r = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!r.ok) {
      const corpo = (await r.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false,
        info:
          r.status === 401
            ? "Token recusado pelo Mercado Pago (401). Confira se copiou o access token inteiro."
            : `Mercado Pago respondeu ${r.status}${corpo?.message ? `: ${corpo.message}` : ""}`,
      };
    }
    const d = (await r.json()) as { nickname?: string; email?: string; id?: number; site_id?: string };
    const quem = [d.nickname, d.email].filter(Boolean).join(" · ") || `conta ${d.id ?? "?"}`;
    return { ok: true, info: `${quem}${d.site_id ? ` (${d.site_id})` : ""}` };
  } catch (e) {
    return { ok: false, info: e instanceof Error ? e.message : "Falha ao falar com o Mercado Pago." };
  }
}
