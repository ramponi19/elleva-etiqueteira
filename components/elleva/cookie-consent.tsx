"use client";

import Link from "next/link";
import Script from "next/script";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

// Consentimento de cookies (LGPD, Fase D): o GTM só carrega depois do aceite.
// Sem NEXT_PUBLIC_GTM_ID não há cookie de medição — então nem banner aparece
// (os cookies de sessão do login são essenciais e estão na Política).
const CHAVE = "elleva:cookies";
type Escolha = "aceitos" | "essenciais";

// Mini-store sobre o localStorage: useSyncExternalStore evita mismatch de
// hidratação (no servidor a escolha é "pendente" e nada é renderizado).
const ouvintes = new Set<() => void>();
function assinar(cb: () => void) {
  ouvintes.add(cb);
  return () => void ouvintes.delete(cb);
}
function lerEscolha(): Escolha | null {
  return localStorage.getItem(CHAVE) as Escolha | null;
}
function gravarEscolha(e: Escolha) {
  localStorage.setItem(CHAVE, e);
  ouvintes.forEach((cb) => cb());
}

export default function CookieConsent({ gtmId }: { gtmId?: string }) {
  const escolha = useSyncExternalStore(
    assinar,
    lerEscolha,
    () => "pendente" as const
  );

  if (!gtmId || escolha === "pendente") return null;

  return (
    <>
      {escolha === "aceitos" && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}

      {escolha === null && (
        <div
          role="dialog"
          aria-label="Aviso de cookies"
          className="fixed bottom-4 left-4 right-4 z-[80] mx-auto max-w-[520px] rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-papel p-5 shadow-[4px_4px_0_var(--color-tinta)]"
        >
          <p className="rotulo m-0 text-sol-escuro">Cookies</p>
          <p className="corpo-suave m-0 mt-2">
            A gente usa cookies pra medir o site e melhorar sua experiência.
            Você escolhe — os detalhes estão na{" "}
            <Link href="/privacy" className="text-sol-escuro underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variante="tinta" onClick={() => gravarEscolha("aceitos")}>
              Aceitar cookies
            </Button>
            <Button type="button" variante="contorno" onClick={() => gravarEscolha("essenciais")}>
              Só o essencial
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
