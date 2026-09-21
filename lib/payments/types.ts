// ============================================================
// Camada de pagamento plugável — contrato do provedor
// ============================================================
// O checkout, o webhook e o reembolso falam SÓ com esta interface.
// Trocar de instituição = novo adaptador + escolher a conta em
// /admin/pagamentos (migration 0062): sem tocar no fluxo de compra e sem redeploy.

/** Credenciais de UMA conta no gateway. Vêm do banco (payment_accounts, já
 *  decifradas) ou, se nenhuma conta estiver cadastrada, das envs antigas. */
export interface ProviderCredentials {
  accessToken: string | null;
  /** chave pública usada pelo SDK no navegador — não é segredo */
  publicKey: string | null;
  webhookSecret: string | null;
  environment: "sandbox" | "production";
}

export interface Buyer {
  email: string;
  firstName?: string;
  lastName?: string;
  cpf?: string;
}

export interface PixChargeInput {
  amount: number;
  description: string;
  orderId: string;          // vira a referência externa no gateway
  expiration: string;       // instante de expiração já no formato do gateway
  notificationUrl: string;  // URL do webhook
  buyer: Buyer;
}
export interface PixChargeResult {
  paymentId: string;
  qrBase64: string;
  copyPaste: string;
}

export interface CardChargeInput {
  amount: number;
  token: string;            // token do cartão tokenizado no navegador
  paymentMethodId: string;
  installments: number;
  description: string;
  orderId: string;
  notificationUrl: string;
  buyer: Buyer;
}
export type PaymentStatus = "approved" | "pending" | "rejected";
export interface CardChargeResult {
  paymentId: string;
  status: PaymentStatus;
  /** motivo cru do gateway (ex.: status_detail do MP) — pra mapear msg ao comprador */
  detail?: string;
}

// Status normalizado que o webhook precisa para decidir a ação.
export type WebhookStatus = "approved" | "refunded" | "cancelled" | "rejected" | "other";
export interface WebhookPayment {
  orderId: string | null;
  status: WebhookStatus;
}

export interface PaymentProvider {
  /** identificador salvo em orders.payment_provider (ex.: "mercadopago") */
  readonly id: string;
  /** há credenciais configuradas? (senão o checkout cai no modo mock/free) */
  isConfigured(): boolean;
  createPixCharge(input: PixChargeInput): Promise<PixChargeResult>;
  createCardCharge(input: CardChargeInput): Promise<CardChargeResult>;
  refund(paymentId: string): Promise<void>;
  /** valida a assinatura do webhook recebido */
  verifyWebhookSignature(request: Request, dataId: string | null): boolean;
  /** lê o pagamento no gateway (usado pelo webhook) */
  fetchWebhookPayment(paymentId: string): Promise<WebhookPayment | null>;
}
