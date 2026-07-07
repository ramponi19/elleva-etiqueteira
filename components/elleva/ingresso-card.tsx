import { Badge } from "@/components/ui/badge";

// Ingresso comprado (spec §6): identidade em cima, picote + notches nas
// laterais, e o "canhoto" com o QR embaixo. Papel/tinta, geometria de ingresso.
const STATUS: Record<string, { label: string; tom: "sol" | "tinta" | "papel" }> = {
  valid: { label: "Válido", tom: "sol" },
  used: { label: "Utilizado", tom: "papel" },
  cancelled: { label: "Cancelado", tom: "tinta" },
};

function Notch({ lado }: { lado: "esquerda" | "direita" }) {
  return (
    <span
      aria-hidden
      className="absolute top-0 z-10 h-[17px] w-[17px] -translate-y-1/2 rounded-full border-[1.5px] border-tinta bg-[var(--cor-fundo)]"
      style={lado === "esquerda" ? { left: -9 } : { right: -9 }}
    />
  );
}

export function IngressoCard({
  eventTitle,
  tierName,
  status,
  code,
  qr,
}: {
  eventTitle: string;
  tierName: string;
  status: string;
  code: string;
  qr: string;
}) {
  const s = STATUS[status] ?? { label: status, tom: "papel" as const };
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white">
      {/* Identidade */}
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge tom="tinta">{tierName}</Badge>
          <Badge tom={s.tom}>{s.label}</Badge>
        </div>
        <h3 className="titulo-card text-tinta">{eventTitle}</h3>
      </div>

      {/* Canhoto — QR abaixo do picote */}
      <div className="relative">
        <Notch lado="esquerda" />
        <Notch lado="direita" />
        <div className="picote-h border-tinta">
          <div className="flex flex-col items-center gap-3 p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt={`Ingresso ${code}`}
              width={180}
              height={180}
              className="rounded-[6px]"
            />
            <span className="rotulo text-tinta-60">{code}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
