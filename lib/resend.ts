import { Resend } from "resend";

let _resend: Resend | null = null;

/** Client Resend, ou null se RESEND_API_KEY não estiver configurada. */
export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Elleva Tickets <noreply@elleva.com.br>";
