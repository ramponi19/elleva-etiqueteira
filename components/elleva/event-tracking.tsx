"use client";

import Script from "next/script";
import { useConsent } from "@/components/elleva/cookie-consent";
import { safeMetaPixel, safeGaId } from "@/lib/tracking-ids";

// Última barreira antes de virar HTML: os IDs viram texto CRU dentro de um
// <script>, então só passa quem bate o formato exato (safeMetaPixel/safeGaId).
// Assim um valor legado malicioso já salvo no banco também é ignorado — nada de
// aspa, parêntese ou `<` chega ao script. Mesma allowlist do servidor (events.ts).

// Pixel/GA por evento — dispara PageView/ViewContent só com consentimento de
// cookies (LGPD). Sem IDs válidos ou sem aceite, não carrega nada.
export function EventTracking({ metaPixel, ga }: { metaPixel?: string | null; ga?: string | null }) {
  const consent = useConsent();
  const pixel = safeMetaPixel(metaPixel);
  const gaId = safeGaId(ga);
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
