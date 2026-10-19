import { describe, it, expect } from "vitest";
import nodemailer from "nodemailer";

// Compatibilidade do nodemailer com o jeito que lib/mailer.ts o usa (import
// padrão, createTransport, sendMail com html e anexo inline por cid). Usa o
// transporte de stream: monta a mensagem MIME sem rede e sem SMTP.
describe("nodemailer — formato usado em lib/mailer.ts", () => {
  it("monta a mensagem com assunto, html e QR inline", async () => {
    const tx = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
    const info = await tx.sendMail({
      from: "Elleva <contato@ellevaeventos.com.br>",
      to: "comprador@example.com",
      subject: "Seu ingresso — Elleva",
      html: '<p>Olá</p><img src="cid:qr-1">',
      attachments: [{ filename: "qr.png", content: Buffer.from("png"), cid: "qr-1", contentType: "image/png" }],
    });
    const raw = (info.message as Buffer).toString("utf8");
    expect(info.envelope).toEqual({ from: "contato@ellevaeventos.com.br", to: ["comprador@example.com"] });
    expect(raw).toContain("Content-Type: text/html");
    expect(raw).toContain("Content-ID: <qr-1>");
    expect(raw).toMatch(/^Subject: /m);
  });
});
