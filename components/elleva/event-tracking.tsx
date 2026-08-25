"use client";

import Script from "next/script";
import { useConsent } from "@/components/elleva/cookie-consent";

// Estes IDs viram texto CRU dentro de um <script>. Última barreira antes de
// virar HTML: só passa quem bate o formato exato (dígitos p/ Meta; prefixo
// conhecido + alfanum/hífen p/ Google). Assim, mesmo um valor legado malicioso
// já salvo no banco (anterior à validação do servidor) é simplesmente ignorado
// — nada de aspa, parêntese ou `<` chega ao script. Espelha events.ts.
const META_OK = /^\d{8,20}$/;
const GA_OK = /^(G|UA|AW|GT)-[A-Za-z0-9-]{4,20}$/;

// Pixel/GA por evento — dispara PageView/ViewContent só com consentimento de
// cookies (LGPD). Sem IDs válidos ou sem aceite, não carrega nada.
export function EventTracking({ metaPixel, ga }: { metaPixel?: string | null; ga?: string | null }) {
  const consent = useConsent();
  const pixel = metaPixel?.trim() && META_OK.test(metaPixel.trim()) ? metaPixel.trim() : null;
  const gaId = ga?.trim() && GA_OK.test(ga.trim()) ? ga.trim() : null;
  if (consent !== "aceitos" || (!pixel && !gaId)) return null;

  return (
    <>
      {pixel && (
        <Script id={`fbq-${pixel}`} strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');fbq('track','ViewContent');`}
        </Script>
      )}
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id={`ga-${gaId}`} strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
    </>
  );
}
