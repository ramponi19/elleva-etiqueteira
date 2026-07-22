"use client";

import Script from "next/script";
import { useConsent } from "@/components/elleva/cookie-consent";

// Pixel/GA por evento — dispara PageView/ViewContent só com consentimento de
// cookies (LGPD). Sem IDs ou sem aceite, não carrega nada.
export function EventTracking({ metaPixel, ga }: { metaPixel?: string | null; ga?: string | null }) {
  const consent = useConsent();
  if (consent !== "aceitos" || (!metaPixel && !ga)) return null;

  return (
    <>
      {metaPixel && (
        <Script id={`fbq-${metaPixel}`} strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixel}');fbq('track','PageView');fbq('track','ViewContent');`}
        </Script>
      )}
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id={`ga-${ga}`} strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
    </>
  );
}
