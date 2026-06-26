"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { useCart } from "@/lib/cart";
import { fmtBRL } from "@/lib/format";
import { TIERS, type EventItem } from "@/lib/events";

export default function TicketSelector({ event }: { event: EventItem }) {
  const router = useRouter();
  const { addItems } = useCart();
  const [qty, setQty] = useState<Record<string, number>>({});

  const inc = (id: string) => setQty((q) => ({ ...q, [id]: (q[id] || 0) + 1 }));
  const dec = (id: string) => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));

  const subtotal = TIERS.reduce((a, t) => a + (qty[t.id] || 0) * t.price, 0);

  const addToCart = () => {
    const items = TIERS.filter((t) => (qty[t.id] || 0) > 0).map((t) => ({
      evt: event.title,
      tier: t.name,
      price: t.price,
      qty: qty[t.id],
    }));
    if (!items.length) return;
    addItems(items);
    router.push("/checkout");
  };

  return (
    <div className="ticket-box">
      <h4 className="h4" style={{ fontSize: 18 }}>Selecione seus ingressos</h4>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {TIERS.map((t) => (
          <div className="tier" key={t.id}>
            <div style={{ flex: 1 }}>
              <div className="tier-name">{t.name}</div>
              <div className="tier-desc">{t.desc}</div>
              <div className="tier-price">{fmtBRL(t.price)}</div>
            </div>
            <div className="stepper">
              <span className="step" onClick={() => dec(t.id)}><Icon icon="lucide:minus" /></span>
              <span className="qty">{qty[t.id] || 0}</span>
              <span className="step" onClick={() => inc(t.id)}><Icon icon="lucide:plus" /></span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
        <span style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Subtotal</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500 }}>{fmtBRL(subtotal)}</span>
      </div>

      <button className="btn btn-gold btn-block" style={{ marginTop: 18 }} onClick={addToCart} disabled={subtotal === 0}>
        Adicionar ao carrinho <Icon icon="lucide:arrow-right" />
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, fontSize: 12, color: "var(--text-tertiary)" }}>
        <Icon icon="solar:shield-check-bold-duotone" style={{ color: "var(--text-gold)", fontSize: 16 }} /> Compra 100% segura
      </div>
    </div>
  );
}
