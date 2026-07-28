// E-mails do financeiro (repasse pago / não aprovado). Silencioso se o SMTP
// não estiver configurado — e-mail nunca quebra o fluxo de dinheiro.
import type { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, isMailerConfigured } from "@/lib/mailer";
import { fmtBRL } from "@/lib/format";

type Svc = Awaited<ReturnType<typeof createServiceClient>>;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** e-mail do produtor (profiles não guarda e-mail; vem do auth) */
async function producerEmail(svc: Svc, producerId: string): Promise<string | null> {
  try {
    const { data } = await svc.auth.admin.getUserById(producerId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

function wrap(inner: string) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;background:#FAF5EC">
    ${inner}
    <a href="${APP_URL}/produtor/financeiro" style="display:inline-block;margin-top:22px;background:#E8481F;color:#141210;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:9999px;font-size:15px">Ver meu financeiro</a>
    <p style="color:rgba(20,18,16,.6);font-size:12px;margin-top:20px;line-height:1.5">Elleva Tickets · bilheteria oficial do interior</p>
  </div>`;
}

export async function sendPayoutPaidEmail(
  svc: Svc,
  producerId: string,
  info: { amount: number; net: number; fee: number; kind: string; reference: string | null }
) {
  if (!isMailerConfigured()) return;
  const to = await producerEmail(svc, producerId);
  if (!to) return;
  const isAdvance = info.kind === "advance";
  const html = wrap(`
    <p style="margin:0;color:#C93A15;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Repasse concluído</p>
    <h1 style="margin:6px 0 0;color:#141210;font-size:28px;line-height:1;text-transform:uppercase;font-weight:900">Dinheiro enviado!</h1>
    <p style="color:#141210;font-size:15px;margin:14px 0 0">Transferimos o repasse para a sua chave Pix cadastrada.</p>
    <div style="margin-top:18px;border:2px solid #141210;border-radius:14px;background:#fff;padding:18px">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#141210">
        <tr><td style="padding:4px 0;color:rgba(20,18,16,.6)">Valor do saldo</td><td style="text-align:right;font-weight:bold">${fmtBRL(info.amount)}</td></tr>
        ${isAdvance ? `<tr><td style="padding:4px 0;color:rgba(20,18,16,.6)">Taxa de antecipação</td><td style="text-align:right">− ${fmtBRL(info.fee)}</td></tr>` : ""}
        <tr><td style="padding:8px 0 0;border-top:1px dashed rgba(20,18,16,.2);color:rgba(20,18,16,.6)">Recebido</td><td style="padding:8px 0 0;border-top:1px dashed rgba(20,18,16,.2);text-align:right;font-size:20px;font-weight:900">${fmtBRL(info.net)}</td></tr>
      </table>
      ${info.reference ? `<p style="margin:12px 0 0;color:rgba(20,18,16,.6);font-size:12px">Comprovante: ${info.reference}</p>` : ""}
    </div>`);
  try {
    await sendEmail({ to, subject: `Repasse de ${fmtBRL(info.net)} enviado — Elleva Tickets`, html });
  } catch { /* ignore */ }
}

export async function sendPayoutRejectedEmail(svc: Svc, producerId: string, amount: number, reason: string) {
  if (!isMailerConfigured()) return;
  const to = await producerEmail(svc, producerId);
  if (!to) return;
  const html = wrap(`
    <p style="margin:0;color:#C93A15;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Repasse em espera</p>
    <h1 style="margin:6px 0 0;color:#141210;font-size:26px;line-height:1.05;text-transform:uppercase;font-weight:900">Sua solicitação ficou pendente</h1>
    <p style="color:#141210;font-size:15px;margin:14px 0 0">A solicitação de ${fmtBRL(amount)} não foi aprovada agora. O saldo continua na sua conta e você pode solicitar de novo.</p>
    <div style="margin-top:16px;border:1px solid rgba(20,18,16,.2);border-radius:12px;background:#fff;padding:14px 18px">
      <p style="margin:0;color:rgba(20,18,16,.6);font-size:12px;letter-spacing:2px;text-transform:uppercase">Motivo</p>
      <p style="margin:6px 0 0;color:#141210;font-size:14px">${reason}</p>
    </div>`);
  try {
    await sendEmail({ to, subject: "Sobre a sua solicitação de repasse — Elleva Tickets", html });
  } catch { /* ignore */ }
}
