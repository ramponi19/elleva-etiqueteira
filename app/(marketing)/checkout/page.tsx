"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/shared/icon";
import { useCart } from "@/lib/cart";
import { fmtBRL } from "@/lib/format";

export default function CheckoutPage() {
  const { items, subtotal, fee, total, removeItem, clear } = useCart();
  const [confirmed, setConfirmed] = useState(false);
  const [pay, setPay] = useState<"pix" | "card">("pix");

  const finalize = () => {
    if (!items.length) return;
    setConfirmed(true);
    clear();
  };

  if (confirmed) {
    return (
      <div className="container" style={{ maxWidth: 1100, padding: "40px 48px 64px" }}>
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--navy-800)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <Icon icon="solar:check-circle-bold" style={{ fontSize: 48, color: "var(--gold-500)" }} />
          </div>
          <h1 className="h1" style={{ fontSize: 42, marginTop: 28 }}>
            Compra <span className="serif accent-gold">confirmada</span>.
          </h1>
          <p className="lede" style={{ maxWidth: 440, margin: "16px auto 0" }}>
            Seus ingressos foram enviados para o seu e-mail e já estão na sua conta Elleva.
          </p>
          <Link href="/" className="btn btn-navy btn-lg" style={{ marginTop: 32 }}>
            Voltar para a home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 1100, padding: "40px 48px 64px" }}>
      <span className="eyebrow eyebrow-gold">Checkout</span>
      <h1 className="h1" style={{ fontSize: 44, marginTop: 16 }}>
        Seu <span className="serif accent-gold">carrinho</span>
      </h1>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <Icon icon="solar:cart-cross-bold-duotone" style={{ fontSize: 64, color: "var(--text-muted)" }} />
          <p className="lede" style={{ marginTop: 18 }}>Seu carrinho está vazio.</p>
          <Link href="/agenda" className="btn btn-navy btn-lg" style={{ marginTop: 24 }}>
            Explorar eventos
          </Link>
        </div>
      ) : (
        <div className="checkout-layout" style={{ marginTop: 36 }}>
          {/* items + form */}
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((item, idx) => (
                <div className="cart-item" key={idx}>
                  <div className="thumb">
                    <Icon icon="solar:ticket-bold-duotone" style={{ fontSize: 26, color: "var(--gold-500)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500 }}>{item.evt}</div>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 3 }}>
                      {item.tier} · {item.qty} ingresso(s)
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>
                    {fmtBRL(item.price * item.qty)}
                  </span>
                  <span className="nav-link" onClick={() => removeItem(idx)} style={{ color: "var(--text-muted)", display: "flex", cursor: "pointer" }}>
                    <Icon icon="lucide:trash-2" style={{ fontSize: 18 }} />
                  </span>
                </div>
              ))}
            </div>

            <h3 className="h3" style={{ fontSize: 22, marginTop: 36 }}>Seus dados</h3>
            <div className="field-grid" style={{ marginTop: 18 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="field-label">NOME COMPLETO</label>
                <input className="input" placeholder="Seu nome" />
              </div>
              <div>
                <label className="field-label">E-MAIL</label>
                <input className="input" placeholder="voce@email.com" />
              </div>
              <div>
                <label className="field-label">CPF</label>
                <input className="input" placeholder="000.000.000-00" />
              </div>
            </div>

            <h3 className="h3" style={{ fontSize: 22, marginTop: 32 }}>Pagamento</h3>
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              <div className={`pay-option${pay === "pix" ? " pay-option--active" : ""}`} onClick={() => setPay("pix")}>
                <Icon icon="solar:qr-code-bold-duotone" style={{ fontSize: 24, color: pay === "pix" ? "var(--text-gold)" : "var(--text-tertiary)" }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Pix</span>
              </div>
              <div className={`pay-option${pay === "card" ? " pay-option--active" : ""}`} onClick={() => setPay("card")}>
                <Icon icon="solar:card-bold-duotone" style={{ fontSize: 24, color: pay === "card" ? "var(--text-gold)" : "var(--text-tertiary)" }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-secondary)" }}>Cartão</span>
              </div>
            </div>
          </div>

          {/* summary */}
          <div className="summary">
            <h4 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 17, color: "#F6F3EB", margin: 0 }}>Resumo</h4>
            <div className="summary-row" style={{ marginTop: 20 }}><span>Subtotal</span><span>{fmtBRL(subtotal)}</span></div>
            <div className="summary-row" style={{ marginTop: 12 }}><span>Taxa de serviço</span><span>{fmtBRL(fee)}</span></div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.12)" }}>
              <span style={{ color: "#F6F3EB", fontSize: 15 }}>Total</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, color: "#F6F3EB" }}>{fmtBRL(total)}</span>
            </div>
            <button className="btn btn-gold btn-block" style={{ marginTop: 22 }} onClick={finalize}>
              Finalizar compra
            </button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, fontSize: 12, color: "#8894A8" }}>
              <Icon icon="solar:lock-keyhole-bold-duotone" style={{ color: "var(--gold-500)", fontSize: 16 }} /> Pagamento criptografado
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
