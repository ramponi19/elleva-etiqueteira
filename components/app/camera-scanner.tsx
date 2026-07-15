"use client";

import { useEffect, useRef, useState } from "react";

type Status = "opening" | "scanning" | "error";

/** Scanner de QR via câmera (html5-qrcode, carregado dinamicamente).
 *  Tenta a câmera traseira; se indisponível, cai para qualquer câmera.
 *  Falhas viram mensagem visível (nunca caixa vazia — portaria precisa saber). */
export default function CameraScanner({
  onScan,
}: {
  onScan: (text: string) => void;
}) {
  const containerId = "qr-reader";
  const stoppedRef = useRef(false);
  const [status, setStatus] = useState<Status>("opening");

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelled = false;
    stoppedRef.current = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const instance = new Html5Qrcode(containerId);
        scanner = instance;

        const config = { fps: 10, qrbox: { width: 240, height: 240 } };
        const onDecode = (decoded: string) => {
          if (stoppedRef.current) return;
          stoppedRef.current = true;
          instance.stop().then(() => instance.clear()).catch(() => {});
          onScan(decoded);
        };

        try {
          // preferência: câmera traseira (celular na portaria)
          await instance.start({ facingMode: "environment" }, config, onDecode, () => {});
        } catch {
          // fallback: primeira câmera disponível (notebook, webview, etc.)
          const cams = await Html5Qrcode.getCameras();
          if (cancelled) return;
          if (!cams.length) throw new Error("no-camera");
          await instance.start(cams[0].id, config, onDecode, () => {});
        }
        if (!cancelled) setStatus("scanning");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (scanner && !stoppedRef.current) {
        scanner.stop().then(() => scanner?.clear()).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-[360px]">
      <div
        id={containerId}
        className="overflow-hidden rounded-[10px] border-[1.5px] border-tinta"
        style={{ display: status === "error" ? "none" : undefined }}
      />
      {status === "opening" && (
        <p className="corpo-suave mt-2">Abrindo a câmera…</p>
      )}
      {status === "error" && (
        <div className="rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-4 py-3">
          <p className="m-0 text-[14px] font-medium text-sol-escuro">
            Não foi possível acessar a câmera.
          </p>
          <p className="corpo-suave m-0 mt-1">
            Verifique a permissão de câmera do navegador (cadeado na barra de endereço)
            e recarregue — ou digite o código do ingresso acima.
          </p>
        </div>
      )}
    </div>
  );
}
