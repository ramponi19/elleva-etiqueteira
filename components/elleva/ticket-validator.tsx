"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { clsx } from "clsx";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { validateTicket, type ValidateResult } from "@/lib/actions/tickets";

const CameraScanner = dynamic(() => import("@/components/app/camera-scanner"), { ssr: false });

// Validador de ingresso no design Cartaz de Show (papel/tinta).
export function TicketValidatorElleva() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);

  async function run(value: string) {
    if (!value.trim()) return;
    setLoading(true);
    const res = await validateTicket(value);
    setLoading(false);
    setResult(res);
    if (res.ok) setCode("");
  }

  const input =
    "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 font-mono text-[15px] uppercase text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";

  const ok = result?.ok;
  // paleta: ok = palco (verde), usado = cartaz (âmbar), inválido = sol-escuro
  const tone = !result
    ? "var(--color-tinta)"
    : ok
      ? "var(--color-palco)"
      : result.reason === "used"
        ? "var(--color-cartaz)"
        : "var(--color-sol-escuro)";

  return (
    <div className="max-w-[460px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(code);
        }}
        className="flex gap-2"
      >
        <input
          className={input}
          placeholder="ELV-XXXXXXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" variante="tinta" disabled={loading}>
          {loading ? "..." : "Validar"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setScanning((s) => !s);
          setResult(null);
        }}
        className="mt-3 inline-flex items-center gap-2 text-[14px] font-medium text-sol-escuro"
      >
        <Icon icon={scanning ? "lucide:x" : "solar:qr-code-bold-duotone"} style={{ fontSize: 18 }} />
        {scanning ? "Fechar câmera" : "Escanear com câmera"}
      </button>

      {scanning && (
        <div className="mt-4">
          <CameraScanner
            onScan={(text: string) => {
              setScanning(false);
              setCode(text);
              run(text);
            }}
          />
          <p className="corpo-suave mt-2">Aponte a câmera para o QR code do ingresso.</p>
        </div>
      )}

      {result && (
        <div
          className={clsx(
            "mt-4 flex items-center gap-3.5 rounded-[var(--radius-card)] border-[1.5px] bg-white p-5"
          )}
          style={{ borderColor: tone }}
        >
          <Icon
            icon={ok ? "solar:check-circle-bold" : result.reason === "used" ? "solar:danger-triangle-bold" : "solar:close-circle-bold"}
            style={{ fontSize: 40, color: tone, flexShrink: 0 }}
          />
          <div className="min-w-0">
            {ok ? (
              <>
                <p className="m-0 font-bold" style={{ color: tone }}>Entrada liberada ✓</p>
                <p className="m-0 mt-0.5 text-[14px] text-tinta">{result.eventTitle} · {result.tierName}</p>
                <p className="m-0 font-mono text-[12px] text-tinta-60">{result.code}</p>
              </>
            ) : (
              <>
                <p className="m-0 font-bold" style={{ color: tone }}>{result.message}</p>
                {result.reason === "used" && result.usedAt && (
                  <p className="corpo-suave m-0 mt-0.5">
                    Utilizado em {new Date(result.usedAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
