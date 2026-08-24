"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Última rede: erro de renderização que derruba a árvore inteira.
 *
 * Sem este arquivo a tela branca é o único sinal — e ela não chega a ninguém.
 * Aqui o erro é reportado E a pessoa recebe uma saída, em vez de ficar olhando o
 * nada sem saber se o problema é a internet dela.
 *
 * Estilos inline de propósito: se a falha veio do layout/tema, importar o design
 * system aqui poderia estourar de novo dentro da própria tela de erro.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#FAF5EC", color: "#141210", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 460, margin: "16vh auto", padding: "0 24px", textAlign: "center" }}>
          <p style={{ margin: 0, color: "#C93A15", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>
            Elleva Tickets
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.05, margin: "10px 0 0" }}>
            Algo quebrou nesta tela
          </h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(20,18,16,.6)", marginTop: 12 }}>
            O erro foi registrado e vamos olhar. Se você estava comprando,{" "}
            <strong style={{ color: "#141210" }}>nenhuma cobrança é feita sem a confirmação</strong> — e o
            ingresso já pago continua em Meus ingressos.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}>
            <button
              onClick={reset}
              style={{
                minHeight: 44, padding: "0 22px", border: "none", borderRadius: 9999,
                background: "#E8481F", color: "#141210", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}
            >
              Tentar de novo
            </button>
            {/* <a> de propósito: navegação DURA. Se o que quebrou foi o
                router/layout, o <Link> tentaria navegar pelo mesmo caminho que
                acabou de falhar — o recarregamento é o que recupera a tela. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                minHeight: 44, padding: "0 22px", display: "inline-flex", alignItems: "center",
                borderRadius: 9999, border: "1.5px solid #141210", color: "#141210",
                fontSize: 15, fontWeight: 500, textDecoration: "none",
              }}
            >
              Ir para a home
            </a>
          </div>
          {error.digest && (
            <p style={{ fontSize: 12, color: "rgba(20,18,16,.45)", marginTop: 18, fontFamily: "ui-monospace, monospace" }}>
              código do erro: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
