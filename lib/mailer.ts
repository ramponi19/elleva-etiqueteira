// ============================================================
// Envio de e-mail via SMTP (Zoho, ou qualquer provedor SMTP)
// ============================================================
// Genérico de propósito: basta trocar as env SMTP_* para mudar de provedor.
import nodemailer, { type Transporter } from "nodemailer";

/** Escapa dado de usuário antes de entrar no HTML do e-mail. Sem isto, o título
 *  do evento (que o produtor controla) ou o nome do comprador podiam injetar
 *  link/HTML num e-mail que sai do domínio da Elleva — phishing com a marca. */
export function escapeHtml(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let _tx: Transporter | null = null;

function transporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  if (!_tx) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    _tx = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = SSL; 587 = STARTTLS
      auth: { user, pass },
    });
  }
  return _tx;
}

/** Remetente exibido. Padrão: o próprio usuário SMTP. */
export const FROM_EMAIL =
  process.env.MAIL_FROM ??
  `Elleva Tickets <${process.env.SMTP_USER ?? "contato@ellevaeventos.com.br"}>`;

/** Há SMTP configurado? (senão os envios viram no-op silencioso) */
export function isMailerConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export interface MailAttachment {
  filename: string;
  content: Buffer;
  /** referenciável no HTML como <img src="cid:..."> (renderiza inline no Gmail/Outlook) */
  cid?: string;
  contentType?: string;
}

/** Envia um e-mail. Silencioso se o SMTP não estiver configurado. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}): Promise<void> {
  const tx = transporter();
  if (!tx) return;
  await tx.sendMail({
    from: FROM_EMAIL,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  });
}
