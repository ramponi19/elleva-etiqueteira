"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/shared/icon";
import { useCart } from "@/lib/cart";
import { fmtBRL } from "@/lib/format";
import { createOrder, getOrderStatus, previewCoupon } from "@/lib/actions/orders";
import CardForm from "@/components/marketing/card-form";
import { createClient } from "@/lib/supabase/client";

type Pix = { qrBase64: string; copyPaste: string; orderId: string; expiresAt: string };

export default function CheckoutPage() {
  const { items, subtotal, removeItem, clear } = useCart();
  const [confirmed, setConfirmed] = useState(false);
  const [pay, setPay] = useState<"pix" | "card">("pix");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<Pix | null>(null);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const cartItems = items.map((i) => ({
    eventId: i.eventId, eventTitle: i.eventTitle, tierId: i.tierId,
    tierName: i.tierName, price: i.price, qty: i.qty,
  }));

  async function applyCoupon() {
    setCouponMsg(null);
    if (!coupon.trim()) return;
    const res = await previewCoupon(coupon, cartItems);
    if (!res.ok) { setDiscount(0); setCouponMsg(res.error); return; }
    setDiscount(res.discount);
    setCouponMsg(`Desconto de ${fmtBRL(res.discount)} aplicado!`);
  }

  // total com desconto: (subtotal - desconto) + taxa(10% sobre base)
  const base = Math.max(0, subtotal - discount);
  const feeAdj = Math.round(base * 0.1);
  const totalAdj = base + feeAdj;

  // Contagem regressiva do Pix
  useEffect(() => {
    if (!pix) return;
    const tick = () => setRemaining(Math.max(0, Math.floor((new Date(pix.expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [pix]);

  // Polling do status enquanto aguarda o Pix
  useEffect(() => {
    if (!pix) return;
    const t = setInterval(async () => {
      const status = await getOrderStatus(pix.orderId);
      if (status === "paid") {
        clearInterval(t);
        clear();
        setConfirmed(true);
        setPix(null);
      } else if (status === "cancelled") {
        clearInterval(t);
        setPix(null);
        setError("O pagamento não foi concluído. Tente novamente.");
      }
    }, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pix]);

  // pré-preenche nome/e-mail do usuário logado (veio pelo gate de acesso)
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail((e) => e || user.email || "");
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      if (profile?.full_name) setName((n) => n || profile.full_name);
    })();
  }, []);

  const finalize = async () => {
    if (!items.length) return;
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Preencha nome e e-mail para continuar.");
      return;
    }
    setLoading(true);
    const res = await createOrder({
      buyerName: name,
      buyerEmail: email,
      buyerCpf: cpf,
      couponCode: coupon || undefined,
      items: cartItems,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.paid) {
      clear();
      setConfirmed(true);
      return;
    }
    setPix({ ...res.pix, orderId: res.orderId, expiresAt: res.expiresAt });
  };

  if (confirmed) {
    return (
      <div className="container" style={{ maxWidth: 1100, padding: "40px 48px 64px" }}>
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--navy-800)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <Icon icon="solar:check-circle-bold" style={{ fontSize: 48, color: "#fff" }} />
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

  if (pix) {
    return (
      <div className="container" style={{ maxWidth: 1100, padding: "40px 48px 64px" }}>
        <div style={{ maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
          <span className="eyebrow eyebrow-gold no-rule" style={{ justifyContent: "center" }}>Pague com Pix</span>
          <h1 className="h1" style={{ fontSize: 36, marginTop: 14 }}>
            Escaneie o <span className="serif accent-gold">QR code</span>
          </h1>
          <p className="body" style={{ marginTop: 8 }}>
            Total: <strong>{fmtBRL(totalAdj)}</strong> · O pedido confirma automaticamente após o pagamento.
          </p>

          {remaining > 0 ? (
            <>
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 24, marginTop: 24, display: "inline-block" }}>
                {pix.qrBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`data:image/png;base64,${pix.qrBase64}`} alt="QR code Pix" width={240} height={240} style={{ display: "block" }} />
                ) : (
                  <p className="body" style={{ width: 240 }}>QR indisponível — use o código abaixo.</p>
                )}
              </div>

              <p style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-gold)" }}>
                Expira em {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
              </p>

              <div style={{ marginTop: 16, textAlign: "left" }}>
                <label className="field-label">PIX COPIA E COLA</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input" readOnly value={pix.copyPaste} style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
                  <button
                    className="btn btn-navy btn-md"
                    onClick={() => {
                      navigator.clipboard?.writeText(pix.copyPaste);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, color: "var(--text-tertiary)", fontSize: 14 }}>
                <Icon icon="svg-spinners:ring-resize" style={{ fontSize: 18, color: "var(--text-gold)" }} />
                Aguardando confirmação do pagamento...
              </div>
            </>
          ) : (
            <div style={{ marginTop: 28 }}>
              <Icon icon="solar:clock-circle-bold-duotone" style={{ fontSize: 48, color: "var(--text-muted)" }} />
              <p className="lede" style={{ marginTop: 12 }}>Este Pix expirou.</p>
              <button
                className="btn btn-gold btn-lg"
                style={{ marginTop: 16 }}
                disabled={loading}
                onClick={() => { setPix(null); finalize(); }}
              >
                {loading ? "Gerando..." : "Gerar novo Pix"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 1100, padding: "40px 48px 64px" }}>
      <div className="buy-steps" style={{ marginBottom: 18 }}>
        <span>Ingressos</span><span className="sep">·</span>
        <span>Acesso</span><span className="sep">·</span>
        <b>Pagamento</b>
      </div>
      <h1 className="h1" data-reveal-lines style={{ fontSize: 40, marginTop: 4 }}>
        Finalizar <span className="serif accent-gold">compra</span>
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
                    <Icon icon="solar:ticket-bold-duotone" style={{ fontSize: 26, color: "#fff" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500 }}>{item.eventTitle}</div>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 3 }}>
                      {item.tierName} · {item.qty} ingresso(s)
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
                <input className="input" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="field-label">E-MAIL</label>
                <input className="input" type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="field-label">CPF</label>
                <input className="input" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} />
              </div>
            </div>

            <h3 className="h3" style={{ fontSize: 22, marginTop: 32 }}>Pagamento</h3>
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              <div className={`pay-option${pay === "pix" ? " pay-option--active" : ""}`} onClick={() => setPay("pix")}>
                <Icon icon="solar:qr-code-bold-duotone" style={{ fontSize: 24, color: pay === "pix" ? "var(--text-primary)" : "var(--text-tertiary)" }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Pix</span>
              </div>
              <div className={`pay-option${pay === "card" ? " pay-option--active" : ""}`} onClick={() => setPay("card")}>
                <Icon icon="solar:card-bold-duotone" style={{ fontSize: 24, color: pay === "card" ? "var(--text-primary)" : "var(--text-tertiary)" }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-secondary)" }}>Cartão</span>
              </div>
            </div>
          </div>

          {/* summary */}
          <div className="summary">
            <h4 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 17, color: "var(--text-primary)", margin: 0 }}>Resumo</h4>

            {/* Cupom */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Cupom"
                style={{ flex: 1, fontSize: 13, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-tint)", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
              />
              <button type="button" onClick={applyCoupon} className="btn btn-navy btn-sm">Aplicar</button>
            </div>
            {couponMsg && (
              <p style={{ fontSize: 12, marginTop: 6, color: discount > 0 ? "var(--text-primary)" : "#B4291F" }}>{couponMsg}</p>
            )}

            <div className="summary-row" style={{ marginTop: 18 }}><span>Subtotal</span><span>{fmtBRL(subtotal)}</span></div>
            {discount > 0 && (
              <div className="summary-row" style={{ marginTop: 12, color: "var(--text-primary)" }}><span>Desconto</span><span>− {fmtBRL(discount)}</span></div>
            )}
            <div className="summary-row" style={{ marginTop: 12 }}><span>Taxa de serviço</span><span>{fmtBRL(feeAdj)}</span></div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-primary)", fontSize: 15 }}>Total</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, color: "var(--text-primary)" }}>{fmtBRL(totalAdj)}</span>
            </div>
            {error && (
              <p style={{ marginTop: 16, fontSize: 13, color: "#B4291F", background: "rgba(180,41,31,.08)", border: "1px solid rgba(180,41,31,.2)", borderRadius: 10, padding: "8px 12px" }}>
                {error}
              </p>
            )}

            {pay === "card" ? (
              <CardForm
                buyer={{ name, email, cpf }}
                items={items}
                couponCode={coupon || undefined}
                onSuccess={() => { clear(); setConfirmed(true); }}
              />
            ) : (
              <>
                <button className="btn btn-gold btn-block" style={{ marginTop: 22, opacity: loading ? 0.6 : 1 }} onClick={finalize} disabled={loading}>
                  {loading ? "Processando..." : "Pagar com Pix"}
                </button>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, fontSize: 12, color: "var(--text-tertiary)" }}>
                  <Icon icon="solar:lock-keyhole-bold-duotone" style={{ color: "var(--text-tertiary)", fontSize: 16 }} /> Pagamento criptografado
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
