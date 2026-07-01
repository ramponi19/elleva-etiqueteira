"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import AuthModal from "@/components/marketing/auth-modal";
import { useCart } from "@/lib/cart";
import { fmtBRL } from "@/lib/format";
import type { EventItem, Tier } from "@/lib/events";

export default function TicketPurchase({
  event,
  tiers,
  loggedIn,
}: {
  event: EventItem;
  tiers: Tier[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const { addItems } = useCart();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [showAuth, setShowAuth] = useState(false);

  const inc = (id: string, max: number | null) =>
    setQty((q) => {
      const n = (q[id] || 0) + 1;
      if (max != null && n > max) return q;
      return { ...q, [id]: n };
    });
  const dec = (id: string) => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));

  const selected = tiers.filter((t) => (qty[t.id] || 0) > 0);
  const count = selected.reduce((a, t) => a + qty[t.id], 0);
  const subtotal = selected.reduce((a, t) => a + qty[t.id] * t.price, 0);

  function proceed() {
    if (count === 0) return;
    addItems(
      selected.map((t) => ({
        eventId: event.uuid,
        eventSlug: event.id,
        eventTitle: event.title,
        tierId: t.id,
        tierName: t.name,
        price: t.price,
        qty: qty[t.id],
      }))
    );
    router.push("/checkout");
  }

  function onProsseguir() {
    if (count === 0) return;
    if (loggedIn) proceed();
    else setShowAuth(true);
  }

  return (
    <>
      <div className="buy-layout">
        {/* tiers */}
        <div>
          {tiers.map((t) => {
            const soldOut = t.available != null && t.available <= 0;
            const atMax = t.available != null && (qty[t.id] || 0) >= t.available;
            return (
              <div className="buy-tier" key={t.id} style={soldOut ? { opacity: 0.55 } : undefined}>
                <div style={{ flex: 1 }}>
                  <div className="buy-tier__name">{t.name}</div>
                  <div className="buy-tier__desc">{t.desc}</div>
                  <div className="buy-tier__price">
                    <strong>{fmtBRL(t.price)}</strong> <span className="tax">+ taxas</span>
                  </div>
                  {t.available != null && t.available > 0 && t.available <= 10 && (
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                      Últimas {t.available} unidades
                    </div>
                  )}
                </div>
                {soldOut ? (
                  <span className="cat-pill">Esgotado</span>
                ) : (
                  <div className="stepper">
                    <span className="step" onClick={() => dec(t.id)}><Icon icon="lucide:minus" /></span>
                    <span className="qty">{qty[t.id] || 0}</span>
                    <span className="step" onClick={() => !atMax && inc(t.id, t.available)} style={atMax ? { opacity: 0.4, cursor: "not-allowed" } : undefined}>
                      <Icon icon="lucide:plus" />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* painel de resumo (claro) */}
        <div className="buy-panel">
          <div className="buy-panel__head">
            <Icon icon="solar:bill-list-bold-duotone" style={{ fontSize: 20 }} /> Detalhes da compra
          </div>
          <div className="buy-panel__body">
            {selected.length === 0 ? (
              <div className="buy-panel__empty">
                <Icon icon="solar:ticket-bold-duotone" style={{ fontSize: 40, color: "var(--text-muted)" }} />
                <p style={{ marginTop: 10 }}>Você ainda não escolheu ingressos.</p>
              </div>
            ) : (
              selected.map((t) => (
                <div className="buy-line" key={t.id}>
                  <span>{qty[t.id]}× {t.name}</span>
                  <span>{fmtBRL(t.price * qty[t.id])}</span>
                </div>
              ))
            )}
          </div>
          <div className="buy-panel__foot">
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--text-tertiary)" }}>
              <span>Ingressos</span><span>{count}</span>
            </div>
            <div className="buy-total">
              <span style={{ fontSize: 15 }}>Subtotal</span>
              <span className="v">{fmtBRL(subtotal)}</span>
            </div>
            <button className="btn btn-gold btn-block" onClick={onProsseguir} disabled={count === 0}>
              Prosseguir <Icon icon="lucide:arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); proceed(); }} />
      )}
    </>
  );
}
