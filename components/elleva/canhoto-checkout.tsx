"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { clsx } from "clsx";

// modal (e o supabase-js dele) só baixa quando o usuário precisa logar
const AuthModal = dynamic(() => import("@/components/marketing/auth-modal"), {
  ssr: false,
});
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { fmtBRL } from "@/lib/format";
import { feeUnit, round2 } from "@/lib/fees";
import type { EventItem, Tier } from "@/lib/events";

// Coluna de compra da página de evento (spec §7/8.3): o "canhoto" do
// ingresso. Lotes com stepper, total após o picote, CTA único.
export function CanhotoCheckout({
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
  const dec = (id: string) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));

  const selecionados = tiers.filter((t) => (qty[t.id] || 0) > 0);
  const count = selecionados.reduce((a, t) => a + qty[t.id], 0);
  // total já com a taxa de serviço — o comprador nunca é surpreendido depois.
  // Se o produtor ABSORVE a taxa, ela não entra no total do comprador.
  const absorve = !!event.absorbFee;
  const total = round2(
    selecionados.reduce(
      (a, t) => a + qty[t.id] * (t.price + (absorve ? 0 : feeUnit(t.price, event.feePct))),
      0
    )
  );
  const maxParcelas = event.maxInstallments ?? 12;

  function proceed() {
    addItems(
      selecionados.map((t) => ({
        eventId: event.uuid,
        eventSlug: event.id,
        eventTitle: event.title,
        tierId: t.id,
        tierName: t.name,
        price: t.price,
        qty: qty[t.id],
        feePct: event.feePct,
        absorbFee: absorve,
        maxInstallments: maxParcelas,
      }))
    );
    router.push("/checkout");
  }

  function prosseguir() {
    if (count === 0) return;
    if (loggedIn) proceed();
    else setShowAuth(true);
  }

  const stepBtn =
    "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-[18px] leading-none transition-colors duration-[var(--dur-micro)] disabled:cursor-default disabled:opacity-35";

  const ingressos = tiers.filter((t) => !t.isAddon);
  const adicionais = tiers.filter((t) => t.isAddon);

  const linha = (t: Tier) => {
    const esgotado = t.available != null && t.available <= 0;
    const noMax = t.available != null && (qty[t.id] || 0) >= t.available;
    return (
      <div key={t.id} className={clsx("flex items-center gap-3 rounded-[10px] border-[1.5px] border-tinta p-4", esgotado && "opacity-55")}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-tinta">{t.name}</span>
            {esgotado && <Badge tom="tinta">Sold out</Badge>}
          </div>
          {t.desc && <p className="corpo-suave m-0 mt-0.5">{t.desc}</p>}
          <p className="numero m-0 mt-1.5 text-[17px]">
            {fmtBRL(t.price)}{" "}
            <span className="rotulo font-medium text-tinta-60">
              {absorve ? "(taxa inclusa)" : `(+ ${fmtBRL(feeUnit(t.price, event.feePct))} taxa)`}
              {!t.isAddon && <> · meia {fmtBRL(t.price / 2)}</>}
            </span>
          </p>
        </div>
        {!esgotado && (
          <div className="flex flex-shrink-0 items-center gap-2">
            <button type="button" aria-label={`Tirar um ${t.name}`} disabled={(qty[t.id] || 0) === 0} onClick={() => dec(t.id)} className={clsx(stepBtn, "border-[1.5px] border-tinta text-tinta hover:bg-papel-2")}>−</button>
            <span className="numero w-5 text-center text-[15px]" aria-live="polite">{qty[t.id] || 0}</span>
            <button type="button" aria-label={`Adicionar um ${t.name}`} disabled={noMax} onClick={() => inc(t.id, t.available)} className={clsx(stepBtn, "bg-tinta text-papel hover:bg-sol-escuro")}>+</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="lg:border-l-2 lg:border-dashed lg:border-tinta lg:pl-8">
      <p className="rotulo m-0 text-sol-escuro">
        {event.dateFull} · {event.time}
      </p>
      <p className="corpo mt-2">
        {event.venueCity} ·{" "}
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(event.venueCity)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sol-escuro underline underline-offset-2"
        >
          ver no mapa
        </a>
      </p>

      <div className="mt-6 flex flex-col gap-3">{ingressos.map(linha)}</div>
      {adicionais.length > 0 && (
        <div className="mt-6">
          <p className="rotulo text-tinta-60">Adicionais</p>
          <p className="corpo-suave mt-1">Leve também (opcional):</p>
          <div className="mt-3 flex flex-col gap-3">{adicionais.map(linha)}</div>
        </div>
      )}

      {/* total após o picote */}
      <div className="mt-6 border-t-[1.5px] border-dashed border-tinta pt-4">
        <div className="flex items-baseline justify-between">
          <span className="rotulo text-tinta-60">Total com taxas</span>
          <span className="numero text-[26px]">{fmtBRL(total)}</span>
        </div>
        {total > 0 && maxParcelas > 1 && (
          <p className="corpo-suave m-0 mt-1 text-right">
            ou até <strong className="text-tinta">{maxParcelas}x de {fmtBRL(total / maxParcelas)}</strong> no cartão
          </p>
        )}
        <Button
          type="button"
          onClick={prosseguir}
          disabled={count === 0}
          className="mt-4 w-full disabled:cursor-default disabled:opacity-45"
        >
          Garantir meu lugar →
        </Button>
        <p className="corpo-suave m-0 mt-3 text-center">
          Pix aprovado na hora · ingresso no WhatsApp
        </p>
      </div>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={proceed} />
      )}
    </aside>
  );
}
