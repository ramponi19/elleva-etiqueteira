"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { clsx } from "clsx";

const AuthModal = dynamic(() => import("@/components/marketing/auth-modal"), { ssr: false });
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { fmtBRL } from "@/lib/format";
import { feeUnit, round2 } from "@/lib/fees";
import type { EventItem, Tier, Seat } from "@/lib/events";

// Compra com mapa de assentos (spec §7/8.3, opt-in por evento). O comprador
// escolhe os lugares; cada assento vira 1 item do carrinho (qty 1) com o
// preço do lote do setor. O servidor reserva os assentos de forma atômica.
export function SeatMap({
  event,
  tiers,
  seats,
  loggedIn,
}: {
  event: EventItem;
  tiers: Tier[];
  seats: Seat[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const { addItems } = useCart();
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [showAuth, setShowAuth] = useState(false);

  const tierById = useMemo(() => new Map(tiers.map((t) => [t.id, t])), [tiers]);

  // agrupa por setor -> fileira, preservando ordem de posição
  const setores = useMemo(() => {
    const bySector = new Map<string, Seat[]>();
    for (const s of seats) {
      const arr = bySector.get(s.sector) ?? [];
      arr.push(s);
      bySector.set(s.sector, arr);
    }
    return [...bySector.entries()].map(([nome, lista]) => {
      const tier = lista[0]?.tierId ? tierById.get(lista[0].tierId) : undefined;
      const rowsMap = new Map<string, Seat[]>();
      for (const s of [...lista].sort((a, b) => a.posRow - b.posRow || a.posCol - b.posCol)) {
        const r = rowsMap.get(s.rowLabel) ?? [];
        r.push(s);
        rowsMap.set(s.rowLabel, r);
      }
      const fileiras = [...rowsMap.entries()].map(([rl, arr]) => ({
        rowLabel: rl,
        assentos: arr.sort((a, b) => a.posCol - b.posCol),
      }));
      return { nome, tier, fileiras };
    });
  }, [seats, tierById]);

  const selecionados = seats.filter((s) => sel[s.id] && !s.taken);
  const count = selecionados.length;
  const total = round2(
    selecionados.reduce((a, s) => {
      const t = s.tierId ? tierById.get(s.tierId) : undefined;
      const price = t?.price ?? 0;
      return a + price + feeUnit(price, event.feePct);
    }, 0)
  );
  const maxParcelas = event.maxInstallments ?? 12;

  const toggle = (s: Seat) => {
    if (s.taken) return;
    setSel((q) => ({ ...q, [s.id]: !q[s.id] }));
  };

  function proceed() {
    addItems(
      selecionados.map((s) => {
        const t = s.tierId ? tierById.get(s.tierId) : undefined;
        return {
          eventId: event.uuid,
          eventSlug: event.id,
          eventTitle: event.title,
          tierId: s.tierId ?? "",
          tierName: t?.name ?? "Assento",
          price: t?.price ?? 0,
          qty: 1,
          feePct: event.feePct,
          seatId: s.id,
          seatLabel: s.label,
        };
      })
    );
    router.push("/checkout");
  }

  function prosseguir() {
    if (count === 0) return;
    if (loggedIn) proceed();
    else setShowAuth(true);
  }

  const seatBtn = "flex h-7 w-7 items-center justify-center rounded-[5px] text-[10px] font-medium transition-colors duration-[var(--dur-micro)]";

  return (
    <aside className="lg:border-l-2 lg:border-dashed lg:border-tinta lg:pl-8">
      <p className="rotulo m-0 text-sol-escuro">{event.dateFull} · {event.time}</p>
      <p className="corpo mt-2">{event.venueCity}</p>

      {/* palco */}
      <div className="mt-6 rounded-[8px] border-[1.5px] border-dashed border-tinta py-1.5 text-center">
        <span className="rotulo text-tinta-60">Palco / Tela</span>
      </div>

      {/* mapa por setor */}
      <div className="mt-5 flex flex-col gap-6 overflow-x-auto">
        {setores.map((setor) => (
          <div key={setor.nome || "geral"}>
            {(setor.nome || setor.tier) && (
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-[14px] font-semibold text-tinta">{setor.nome || setor.tier?.name}</span>
                {setor.tier && (
                  <span className="numero text-[13px] text-tinta-60">
                    {fmtBRL(setor.tier.price)} <span className="rotulo">+ taxa</span>
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-col gap-1">
              {setor.fileiras.map((fila) => (
                <div key={fila.rowLabel} className="flex items-center gap-1">
                  <span className="w-4 flex-shrink-0 text-right text-[10px] text-tinta-45">{fila.rowLabel}</span>
                  <div className="flex gap-1">
                    {fila.assentos.map((s) => {
                      const ativo = !!sel[s.id] && !s.taken;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={s.taken}
                          onClick={() => toggle(s)}
                          aria-label={`Assento ${s.label}${s.taken ? " (indisponível)" : ""}`}
                          aria-pressed={ativo}
                          title={s.label}
                          className={clsx(
                            seatBtn,
                            s.taken
                              ? "cursor-not-allowed border-[1.5px] border-tinta/15 bg-tinta/10 text-tinta-35 line-through"
                              : ativo
                                ? "bg-sol text-papel"
                                : "border-[1.5px] border-tinta text-tinta hover:bg-papel-2"
                          )}
                        >
                          {s.seatNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* legenda */}
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-tinta-60">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-[3px] border-[1.5px] border-tinta" /> livre</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-[3px] bg-sol" /> escolhido</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-[3px] bg-tinta/10" /> ocupado</span>
      </div>

      {/* total */}
      <div className="mt-6 border-t-[1.5px] border-dashed border-tinta pt-4">
        {count > 0 && (
          <p className="corpo-suave m-0 mb-2">
            {count} assento(s): {selecionados.map((s) => s.label).join(", ")}
          </p>
        )}
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
        <p className="corpo-suave m-0 mt-3 text-center">Pix aprovado na hora · ingresso no WhatsApp</p>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={proceed} />}
    </aside>
  );
}
