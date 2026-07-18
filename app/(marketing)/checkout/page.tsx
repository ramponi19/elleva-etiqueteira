"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/shared/icon";
import { useCart } from "@/lib/cart";
import { fmtBRL } from "@/lib/format";
import { createOrder, getOrderStatus, previewCoupon } from "@/lib/actions/orders";
import CardForm from "@/components/marketing/card-form";
import { Barras } from "@/components/ui/barras";
import { Button } from "@/components/ui/button";
import { ConfirmacaoRasgo, type ItemConfirmado } from "@/components/elleva/confirmacao-rasgo";

type Pix = { qrBase64: string; copyPaste: string; orderId: string; expiresAt: string };

const inputCls =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-3 text-[15px] text-tinta placeholder:text-tinta-35";
const labelCls = "rotulo mb-1.5 block text-tinta-60";

function Notch({ lado }: { lado: "esquerda" | "direita" }) {
  return (
    <span
      aria-hidden
      className="absolute top-0 z-10 h-[17px] w-[17px] -translate-y-1/2 rounded-full border-[1.5px] border-tinta bg-papel"
      style={lado === "esquerda" ? { left: -9 } : { right: -9 }}
    />
  );
}

export default function CheckoutPage() {
  const { items, subtotal, removeItem, clear } = useCart();
  const [confirmado, setConfirmado] = useState<{ itens: ItemConfirmado[]; total: number } | null>(null);
  const [pay, setPay] = useState<"pix" | "card">("pix");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
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

  function confirmar() {
    setConfirmado({
      itens: items.map((i) => ({ eventTitle: i.eventTitle, tierName: i.tierName, qty: i.qty })),
      total: totalAdj,
    });
    clear();
  }

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
        confirmar();
        setPix(null);
      } else if (status === "cancelled") {
        clearInterval(t);
        setPix(null);
        setError("O pagamento não foi concluído. Tenta de novo?");
      }
    }, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pix]);

  // pré-preenche nome/e-mail do usuário logado (veio pelo gate de acesso)
  useEffect(() => {
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
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
      setError("Faltou nome ou e-mail. Preenche pra gente emitir o ingresso.");
      return;
    }
    setLoading(true);
    const res = await createOrder({
      buyerName: name,
      buyerEmail: email,
      buyerCpf: cpf,
      buyerWhatsapp: whatsapp,
      couponCode: coupon || undefined,
      items: cartItems,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.paid) {
      confirmar();
      return;
    }
    setPix({ ...res.pix, orderId: res.orderId, expiresAt: res.expiresAt });
  };

  if (confirmado) {
    return <ConfirmacaoRasgo itens={confirmado.itens} total={confirmado.total} />;
  }

  // ------- TELA DO PIX -------
  if (pix) {
    return (
      <div className="mx-auto max-w-[440px] px-5 pb-20 pt-12 text-center">
        <p className="rotulo m-0 text-sol-escuro">Pagar com Pix</p>
        <h1 className="display-2 mt-3">Escaneia e pronto</h1>
        <p className="corpo mt-3">
          <strong className="numero">{fmtBRL(totalAdj)}</strong> · confirma sozinho
          assim que o banco avisar.
        </p>

        {remaining > 0 ? (
          <>
            <div className="mt-7 inline-block rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white p-5">
              {pix.qrBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`data:image/png;base64,${pix.qrBase64}`} alt="QR code Pix" width={230} height={230} className="block" />
              ) : (
                <p className="corpo w-[230px]">QR indisponível — usa o código abaixo.</p>
              )}
              <p className="numero mt-3 text-[15px] text-sol-escuro">
                expira em {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
              </p>
            </div>

            <div className="mt-5 text-left">
              <label className={labelCls}>Pix copia e cola</label>
              <div className="flex gap-2">
                <input className={`${inputCls} text-[12px]`} readOnly value={pix.copyPaste} />
                <Button
                  variante="tinta"
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(pix.copyPaste);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </div>

            <p className="corpo-suave mt-6 inline-flex items-center gap-2">
              <Icon icon="svg-spinners:ring-resize" style={{ fontSize: 17, color: "var(--color-sol-escuro)" }} />
              Esperando o pagamento cair...
            </p>
          </>
        ) : (
          <div className="mt-8">
            <p className="corpo">Esse Pix expirou. Sem drama:</p>
            <Button className="mt-4" disabled={loading} onClick={() => { setPix(null); finalize(); }}>
              {loading ? "Gerando..." : "Gerar novo Pix"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ------- CHECKOUT (uma coluna, spec 8.4) -------
  return (
    <div className="mx-auto max-w-[560px] px-5 pb-20 pt-10">
      <p className="rotulo m-0 text-tinta-60">
        Ingressos · Acesso · <span className="text-sol-escuro">Pagamento</span>
      </p>
      <h1 className="display-2 mt-3">Garantir meu lugar</h1>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="corpo">Nada por aqui ainda. Escolhe um evento primeiro?</p>
          <Button variante="tinta" href="/" className="mt-6">
            Ver o que está em cartaz
          </Button>
        </div>
      ) : (
        <>
          {/* RESUMO EM FORMATO DE INGRESSO */}
          <div className="relative mt-8 rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="rotulo text-sol-escuro">Seu ingresso</span>
                <Barras />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="titulo-card m-0 text-[15px]">{item.eventTitle}</p>
                      <p className="corpo-suave m-0 mt-0.5">
                        {item.tierName} × {item.qty}
                      </p>
                    </div>
                    <span className="numero flex-shrink-0 text-[16px]">{fmtBRL(item.price * item.qty)}</span>
                    <button
                      type="button"
                      aria-label={`Remover ${item.eventTitle}`}
                      onClick={() => removeItem(idx)}
                      className="flex cursor-pointer text-tinta-35 hover:text-sol-escuro"
                    >
                      <Icon icon="lucide:trash-2" style={{ fontSize: 17 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* picote + canhoto do resumo */}
            <div className="relative">
              <Notch lado="esquerda" />
              <Notch lado="direita" />
              <div className="picote-h border-tinta p-5">
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="Cupom"
                    className={`${inputCls} max-w-[180px] py-2 text-[13px]`}
                  />
                  <Button variante="contorno" type="button" onClick={applyCoupon} className="px-4 py-2 text-[13px]">
                    Aplicar
                  </Button>
                </div>
                {couponMsg && (
                  <p className={`corpo-suave m-0 mt-2 ${discount > 0 ? "text-palco" : "text-sol-escuro"}`}>
                    {couponMsg}
                  </p>
                )}

                <div className="corpo-suave mt-4 flex justify-between">
                  <span>Subtotal</span><span>{fmtBRL(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="corpo-suave mt-1.5 flex justify-between text-palco">
                    <span>Desconto</span><span>− {fmtBRL(discount)}</span>
                  </div>
                )}
                <div className="corpo-suave mt-1.5 flex justify-between">
                  <span>Taxa de serviço</span><span>{fmtBRL(feeAdj)}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between border-t-[1.5px] border-tinta pt-3">
                  <span className="rotulo text-tinta-60">Total</span>
                  <span className="numero text-[26px]">{fmtBRL(totalAdj)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DADOS */}
          <h2 className="rotulo mt-10 text-sol-escuro">Quem vai receber o ingresso</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="ck-nome">Nome completo</label>
              <input id="ck-nome" className={inputCls} placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ck-email">E-mail</label>
              <input id="ck-email" className={inputCls} type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ck-zap">WhatsApp</label>
              <input id="ck-zap" className={inputCls} inputMode="tel" placeholder="(19) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="ck-cpf">CPF (pra meia-entrada)</label>
              <input id="ck-cpf" className={inputCls} inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </div>
          </div>

          {/* PAGAMENTO — Pix primário */}
          <h2 className="rotulo mt-9 text-sol-escuro">Como você paga</h2>
          <div className="mt-4 flex gap-3" role="radiogroup" aria-label="Método de pagamento">
            {(["pix", "card"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={pay === m}
                onClick={() => setPay(m)}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-4 py-3.5 text-[14px] font-medium transition-colors duration-[var(--dur-micro)] ${
                  pay === m ? "border-tinta bg-tinta text-papel" : "border-tinta bg-transparent text-tinta hover:bg-papel-2"
                }`}
              >
                <Icon icon={m === "pix" ? "solar:qr-code-bold" : "solar:card-bold"} style={{ fontSize: 20 }} />
                {m === "pix" ? "Pix — na hora" : "Cartão"}
              </button>
            ))}
          </div>

          {error && (
            <p className="corpo mt-5 rounded-[10px] border-[1.5px] border-sol-escuro bg-papel-2 px-3.5 py-2.5 text-sol-escuro">
              {error}
            </p>
          )}

          {pay === "card" ? (
            <div className="mt-6">
              <CardForm
                buyer={{ name, email, cpf }}
                items={items}
                couponCode={coupon || undefined}
                onSuccess={confirmar}
              />
            </div>
          ) : (
            <>
              <Button className="mt-6 w-full" onClick={finalize} disabled={loading}>
                {loading ? "Gerando o Pix..." : `Pagar com Pix · ${fmtBRL(totalAdj)}`}
              </Button>
              <p className="corpo-suave mt-3 text-center">
                Pix aprovado na hora · ingresso no e-mail e na sua conta
              </p>
            </>
          )}

          <p className="corpo-suave mt-8 text-center">
            Deu dúvida? <Link href="/ajuda" className="text-sol-escuro underline underline-offset-2">Central de Ajuda</Link>
          </p>
        </>
      )}
    </div>
  );
}
