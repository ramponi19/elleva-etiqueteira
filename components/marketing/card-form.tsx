"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/shared/icon";
import { createCardOrder } from "@/lib/actions/orders";
import type { CartItem } from "@/lib/cart";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

// MP SDK injetado em window
interface MpInstance {
  createCardToken(d: Record<string, string>): Promise<{ id: string }>;
  getPaymentMethods(d: { bin: string }): Promise<{ results: { id: string }[] }>;
}
declare global {
  interface Window {
    MercadoPago?: new (key: string, opts?: { locale: string }) => MpInstance;
  }
}

export default function CardForm({
  buyer,
  items,
  onSuccess,
}: {
  buyer: { name: string; email: string; cpf: string };
  items: CartItem[];
  onSuccess: () => void;
}) {
  const mpRef = useRef<MpInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [installments, setInstallments] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!PUBLIC_KEY) return;
    const init = () => {
      if (window.MercadoPago) {
        mpRef.current = new window.MercadoPago(PUBLIC_KEY, { locale: "pt-BR" });
        setReady(true);
      }
    };
    if (window.MercadoPago) return init();
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.mercadopago.com/js/v2"]');
    if (existing) {
      existing.addEventListener("load", init);
      return () => existing.removeEventListener("load", init);
    }
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.onload = init;
    document.body.appendChild(s);
  }, []);

  if (!PUBLIC_KEY) {
    return (
      <p style={{ fontSize: 13, color: "#8894A8" }}>
        Pagamento por cartão indisponível (configure NEXT_PUBLIC_MP_PUBLIC_KEY).
      </p>
    );
  }

  async function pay() {
    setError(null);
    if (!buyer.name.trim() || !buyer.email.trim()) {
      setError("Preencha nome e e-mail.");
      return;
    }
    const mp = mpRef.current;
    if (!mp) {
      setError("Carregando pagamento, tente novamente em instantes.");
      return;
    }
    const [mm, yy] = exp.split("/").map((s) => s.trim());
    if (!mm || !yy) {
      setError("Validade no formato MM/AA.");
      return;
    }
    setLoading(true);
    try {
      const token = await mp.createCardToken({
        cardNumber: number.replace(/\s/g, ""),
        cardholderName: holder,
        cardExpirationMonth: mm,
        cardExpirationYear: yy.length === 2 ? `20${yy}` : yy,
        securityCode: cvv,
        identificationType: "CPF",
        identificationNumber: buyer.cpf.replace(/\D/g, "") || "00000000000",
      });
      const bin = number.replace(/\D/g, "").slice(0, 6);
      const pm = await mp.getPaymentMethods({ bin });
      const paymentMethodId = pm.results[0]?.id;
      if (!paymentMethodId) throw new Error("Cartão não reconhecido.");

      const res = await createCardOrder({
        buyerName: buyer.name,
        buyerEmail: buyer.email,
        buyerCpf: buyer.cpf,
        token: token.id,
        paymentMethodId,
        installments,
        items: items.map((i) => ({
          eventId: i.eventId, eventTitle: i.eventTitle, tierId: i.tierId,
          tierName: i.tierName, price: i.price, qty: i.qty,
        })),
      });
      setLoading(false);
      if (!res.ok) { setError(res.error); return; }
      onSuccess();
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Falha ao validar o cartão.");
    }
  }

  const input = { width: "100%", fontSize: 14, padding: "11px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg-elevated)", color: "var(--text-primary)" } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
      <input style={input} placeholder="Número do cartão" inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} />
      <input style={input} placeholder="Nome impresso no cartão" value={holder} onChange={(e) => setHolder(e.target.value)} />
      <div style={{ display: "flex", gap: 10 }}>
        <input style={input} placeholder="MM/AA" value={exp} onChange={(e) => setExp(e.target.value)} />
        <input style={input} placeholder="CVV" inputMode="numeric" value={cvv} onChange={(e) => setCvv(e.target.value)} />
      </div>
      <select style={input} value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
        {[1, 2, 3, 4, 6, 12].map((n) => <option key={n} value={n}>{n}x</option>)}
      </select>

      {error && <p style={{ fontSize: 13, color: "#d64545" }}>{error}</p>}

      <button className="btn btn-gold btn-block" onClick={pay} disabled={loading || !ready}>
        {loading ? "Processando..." : ready ? "Pagar com cartão" : "Carregando..."}
      </button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, color: "var(--text-tertiary)" }}>
        <Icon icon="solar:lock-keyhole-bold-duotone" style={{ color: "var(--text-gold)", fontSize: 16 }} /> Dados protegidos · tokenização Mercado Pago
      </div>
    </div>
  );
}
