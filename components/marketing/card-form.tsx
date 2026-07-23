"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { createCardOrder } from "@/lib/actions/orders";
import { isValidCPF } from "@/lib/cpf";
import { fmtBRL } from "@/lib/format";
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
  couponCode,
  total = 0,
  maxInstallments = 12,
  onSuccess,
}: {
  buyer: { name: string; email: string; cpf: string };
  items: CartItem[];
  couponCode?: string;
  total?: number;
  maxInstallments?: number;
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
      <p className="text-[13px] text-tinta-60">
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
    if (!isValidCPF(buyer.cpf)) {
      setError("Esse CPF não bateu. Confere os números?");
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
        identificationNumber: buyer.cpf.replace(/\D/g, ""),
      });
      const bin = number.replace(/\D/g, "").slice(0, 6);
      const pm = await mp.getPaymentMethods({ bin });
      const paymentMethodId = pm.results[0]?.id;
      if (!paymentMethodId) throw new Error("Cartão não reconhecido.");

      const res = await createCardOrder({
        buyerName: buyer.name,
        buyerEmail: buyer.email,
        buyerCpf: buyer.cpf,
        couponCode,
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

  const inputCls =
    "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-3 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";

  return (
    <div className="mt-3.5 flex flex-col gap-2.5">
      <input className={inputCls} placeholder="Número do cartão" inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} />
      <input className={inputCls} placeholder="Nome impresso no cartão" value={holder} onChange={(e) => setHolder(e.target.value)} />
      <div className="flex gap-2.5">
        <input className={inputCls} placeholder="MM/AA" value={exp} onChange={(e) => setExp(e.target.value)} />
        <input className={inputCls} placeholder="CVV" inputMode="numeric" value={cvv} onChange={(e) => setCvv(e.target.value)} />
      </div>
      <select className={inputCls} value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
        {[1, 2, 3, 4, 6, 12]
          .filter((n) => n <= maxInstallments)
          .map((n) => (
            <option key={n} value={n}>
              {n === 1 ? `À vista — ${fmtBRL(total)}` : `${n}x de ${fmtBRL(total / n)}`}
            </option>
          ))}
      </select>

      {error && <p className="text-[13px] text-sol-escuro">{error}</p>}

      <Button variante="primario" onClick={pay} disabled={loading || !ready} className="w-full">
        {loading ? "Processando..." : ready ? "Pagar com cartão" : "Carregando..."}
      </Button>
      <div className="flex items-center justify-center gap-2 text-[12px] text-tinta-60">
        <Icon icon="solar:lock-keyhole-bold-duotone" style={{ color: "var(--color-sol-escuro)", fontSize: 16 }} /> Dados protegidos · tokenização Mercado Pago
      </div>
    </div>
  );
}
