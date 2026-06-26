"use client";

import { useEffect, useRef } from "react";

/** Scanner de QR via câmera (html5-qrcode, carregado dinamicamente). */
export default function CameraScanner({
  onScan,
}: {
  onScan: (text: string) => void;
}) {
  const containerId = "qr-reader";
  const stoppedRef = useRef(false);

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
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded: string) => {
            if (stoppedRef.current) return;
            stoppedRef.current = true;
            instance.stop().then(() => instance.clear()).catch(() => {});
            onScan(decoded);
          },
          () => {}
        );
      } catch {
        /* sem câmera / permissão negada */
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
    <div
      id={containerId}
      style={{ width: "100%", maxWidth: 360, borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--border)" }}
    />
  );
}
