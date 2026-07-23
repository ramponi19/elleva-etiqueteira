"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { clsx } from "clsx";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { validateTicket, validateByToken, type ValidateResult, type Operador } from "@/lib/actions/tickets";
import { isValidCPF, formatCPF } from "@/lib/cpf";

const CameraScanner = dynamic(() => import("@/components/app/camera-scanner"), { ssr: false });

const OP_KEY = "elleva_gate_operator";

// Validador de ingresso no design Cartaz de Show (papel/tinta).
// Com `token`, valida via link de portaria (sem login) — e exige que o operador
// se identifique (nome + CPF) antes, pra registrar quem liberou cada entrada.
export function TicketValidatorElleva({ token }: { token?: string } = {}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);

  const [operator, setOperator] = useState<Operador | null>(null);
  const [opForm, setOpForm] = useState({ name: "", doc: "" });
  const [opErr, setOpErr] = useState<string | null>(null);

  // modo portaria (token): carrega o operador salvo no dispositivo
  useEffect(() => {
    if (!token) return;
    try {
      const raw = localStorage.getItem(OP_KEY);
      // hidratação do operador salvo no dispositivo: setState no mount é intencional
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setOperator(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [token]);

  function salvarOperador(e: React.FormEvent) {
    e.preventDefault();
    setOpErr(null);
    if (!opForm.name.trim()) return setOpErr("Informe seu nome.");
    if (!isValidCPF(opForm.doc)) return setOpErr("Esse CPF não bateu. Confere os números?");
    const op: Operador = { name: opForm.name.trim(), doc: opForm.doc };
    setOperator(op);
    try {
      localStorage.setItem(OP_KEY, JSON.stringify(op));
    } catch {
      /* ignore */
    }
  }

  function trocarOperador() {
    setOperator(null);
    setResult(null);
    setOpForm({ name: "", doc: "" });
    try {
      localStorage.removeItem(OP_KEY);
    } catch {
      /* ignore */
    }
  }

  async function run(value: string) {
    if (!value.trim()) return;
    setLoading(true);
    const res = token
      ? await validateByToken(token, value, operator ?? undefined)
      : await validateTicket(value);
    setLoading(false);
    setResult(res);
    if (res.ok) setCode("");
  }

  const input =
    "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 font-mono text-[15px] uppercase text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";
  const inputTexto =
    "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[15px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";

  // Portaria sem operador identificado → pede identificação primeiro
  if (token && !operator) {
    return (
      <div className="max-w-[460px]">
        <p className="rotulo text-sol-escuro">Quem está validando?</p>
        <p className="corpo-suave mb-3 mt-1">
          Identifique-se para liberar entradas. Fica registrado em cada check-in.
        </p>
        <form onSubmit={salvarOperador} className="flex flex-col gap-2">
          <input
            className={inputTexto}
            placeholder="Seu nome"
            value={opForm.name}
            onChange={(e) => setOpForm((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className={inputTexto}
            inputMode="numeric"
            placeholder="Seu CPF"
            value={opForm.doc}
            onChange={(e) => setOpForm((s) => ({ ...s, doc: formatCPF(e.target.value) }))}
          />
          {opErr && <p className="text-[13px] text-sol-escuro">{opErr}</p>}
          <Button type="submit" variante="tinta" className="mt-1">Começar a validar</Button>
        </form>
      </div>
    );
  }

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
      {token && operator && (
        <div className="mb-3 flex items-center justify-between rounded-[8px] border-[1.5px] border-tinta bg-papel-2 px-3 py-2">
          <span className="text-[13px] text-tinta">
            Validando como <strong>{operator.name}</strong>
          </span>
          <button type="button" onClick={trocarOperador} className="text-[12px] text-sol-escuro underline underline-offset-2">
            trocar
          </button>
        </div>
      )}

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
        className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border-[1.5px] border-tinta px-4 text-[15px] font-medium text-tinta transition-colors hover:bg-papel-2"
      >
        <Icon icon={scanning ? "lucide:x" : "solar:qr-code-bold-duotone"} style={{ fontSize: 19, color: "var(--color-sol-escuro)" }} />
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
                <p className="m-0 mt-0.5 text-[14px] text-tinta">
                  {result.eventTitle} · {result.tierName}{result.seat ? ` · ${result.seat}` : ""}
                </p>
                {result.holderName && (
                  <p className="m-0 mt-1.5 text-[14px] text-tinta">
                    Titular: <strong>{result.holderName}</strong>
                    {result.holderDoc ? <> · CPF <strong>{result.holderDoc}</strong></> : null}
                  </p>
                )}
                {result.transferEmail && (
                  <p className="m-0 mt-1.5 text-[13px] text-tinta">
                    Transferido para <strong>{result.transferEmail}</strong>
                  </p>
                )}
                {(result.holderName || result.transferEmail) && (
                  <p className="corpo-suave m-0 mt-1">Confira com o documento na entrada.</p>
                )}
                <p className="m-0 mt-1 font-mono text-[12px] text-tinta-60">{result.code}</p>
                {operator && (
                  <p className="corpo-suave m-0 mt-1">Validado por {operator.name}</p>
                )}
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
