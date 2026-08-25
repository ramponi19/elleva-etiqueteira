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
  // parcelas REAIS do emissor (com juros) — recommended_message já vem em pt-BR
  getInstallments(d: { amount: string; bin: string; paymentTypeId: string }): Promise<
    { payer_costs: { installments: number; recommended_message: string }[] }[]
  >;
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
  // F6: parcelas reais do MP (com juros do emissor). Null até o BIN do cartão
  // permitir a consulta — aí o "12x de R$X" da divisão simples (que mentia
  // quando havia juros) dá lugar ao valor que o emissor realmente cobra.
  const [instOptions, setInstOptions] = useState<{ n: number; label: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analise, setAnalise] = useState(false);

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

  // F6: com o BIN (6 dígitos) e o valor, pergunta ao MP as parcelas REAIS.
  // Debounce pra não consultar a cada tecla; limpa se o cartão encolher.
  useEffect(() => {
    const bin = number.replace(/\D/g, "").slice(0, 6);
    if (!ready || !mpRef.current || bin.length < 6 || !(total > 0)) {
      setInstOptions(null);
      return;
    }
    let cancel = false;
    const t = setTimeout(async () => {
      try {
        const res = await mpRef.current!.getInstallments({ amount: String(total), bin, paymentTypeId: "credit_card" });
        const costs = res?.[0]?.payer_costs ?? [];
        const opts = costs
          .filter((c) => c.installments <= maxInstallments)
          .map((c) => ({ n: c.installments, label: c.recommended_message }));
        if (!cancel && opts.length) {
          setInstOptions(opts);
          setInstallments((cur) => (opts.some((o) => o.n === cur) ? cur : opts[0].n));
        }
      } catch {
        if (!cancel) setInstOptions(null);
      }
    }, 500);
    return () => { cancel = true; clearTimeout(t); };
  }, [number, ready, total, maxInstallments]);

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
      if (res.pending) { setAnalise(true); return; } // em análise: NÃO é "garantido" ainda
      onSuccess();
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Falha ao validar o cartão.");
    }
  }

  const inputCls =
    "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-3 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";

  if (analise) {
    return (
      <div className="mt-3.5 flex items-start gap-3 rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-papel-2 p-5">
        <Icon icon="solar:clock-circle-bold-duotone" style={{ color: "var(--color-sol-escuro)", fontSize: 34, flexShrink: 0 }} />
        <div>
          <p className="m-0 font-bold text-tinta">Pagamento em análise</p>
          <p className="corpo-suave m-0 mt-1">
            O banco está confirmando a compra. Assim que aprovar, seus ingressos vão para <strong>Meus ingressos</strong> e você recebe por e-mail. Não precisa pagar de novo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3.5 flex flex-col gap-2.5">
      <input className={inputCls} placeholder="Número do cartão" inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} />
      <input className={inputCls} placeholder="Nome impresso no cartão" value={holder} onChange={(e) => setHolder(e.target.value)} />
      <div className="flex gap-2.5">
        <input className={inputCls} placeholder="MM/AA" value={exp} onChange={(e) => setExp(e.target.value)} />
        <input className={inputCls} placeholder="CVV" inputMode="numeric" value={cvv} onChange={(e) => setCvv(e.target.value)} />
      </div>
      <select className={inputCls} value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
        {instOptions
          ? instOptions.map((o) => (
              <option key={o.n} value={o.n}>{o.label}</option>
            ))
          : [1, 2, 3, 4, 6, 12]
              .filter((n) => n <= maxInstallments)
              .map((n) => (
                <option key={n} value={n}>
                  {/* sem o BIP do cartão ainda: não mostra valor por parcela (pode
                      ter juros) — o valor real aparece assim que o cartão é digitado */}
                  {n === 1 ? `À vista — ${fmtBRL(total)}` : `Em até ${n}x`}
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
