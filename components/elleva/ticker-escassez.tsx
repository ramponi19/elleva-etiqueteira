"use client";

import { useEffect, useState } from "react";

// Ticker de escassez do cartaz (spec 8.3 + §11) — só com dados REAIS:
// - some quando restam > 50 (escassez só quando verdadeira)
// - some quando algum lote é ilimitado (não dá pra afirmar "restam n")
// - atualiza ao vivo via postgres_changes em ticket_tiers
export function TickerEscassez({
  eventId,
  inicialRestam,
  inicialGarantiram,
}: {
  eventId: string;
  /** null = tem lote ilimitado, sem número honesto pra mostrar */
  inicialRestam: number | null;
  inicialGarantiram: number;
}) {
  const [restam, setRestam] = useState(inicialRestam);
  const [garantiram, setGarantiram] = useState(inicialGarantiram);

  useEffect(() => {
    let cancel = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      async function recomputar() {
        const { data } = await supabase
          .from("ticket_tiers")
          .select("capacity, sold")
          .eq("event_id", eventId);
        if (cancel || !data?.length) return;
        const ilimitado = data.some((t) => t.capacity == null);
        setRestam(
          ilimitado
            ? null
            : data.reduce((a, t) => a + Math.max(0, (t.capacity ?? 0) - (t.sold ?? 0)), 0)
        );
        setGarantiram(data.reduce((a, t) => a + (t.sold ?? 0), 0));
      }

      const channel = supabase
        .channel(`escassez-${eventId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "ticket_tiers", filter: `event_id=eq.${eventId}` },
          recomputar
        )
        .subscribe();

      cleanup = () => {
        supabase.removeChannel(channel);
      };
    })();

    return () => {
      cancel = true;
      cleanup?.();
    };
  }, [eventId]);

  // Regras de honestidade (§11)
  if (restam == null || restam <= 0 || restam > 50) return null;

  const partes = [
    `Restam ${restam} ingresso${restam === 1 ? "" : "s"}`,
    ...(garantiram > 0 ? [`${garantiram} pessoa${garantiram === 1 ? "" : "s"} já garantiram`] : []),
  ];

  return (
    <p
      aria-live="polite"
      className="rotulo m-0 mt-3 flex flex-wrap items-center gap-2 rounded-[10px] border-[1.5px] border-tinta bg-cartaz px-3.5 py-2.5 text-tinta"
    >
      {partes.map((p, i) => (
        <span key={p} className="inline-flex items-center gap-2">
          {i > 0 && <span aria-hidden>✶</span>}
          {p}
        </span>
      ))}
    </p>
  );
}
