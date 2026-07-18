import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { archivo } from "./fonts";
import { SITE_URL } from "@/lib/site";
import CookieConsent from "@/components/elleva/cookie-consent";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#FAF5EC",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Elleva Tickets — Ingressos para os melhores eventos",
    template: "%s | Elleva Tickets",
  },
  description:
    "Compre ingressos para shows, festas, esporte, teatro e congressos no interior de SP e sul de MG. Rápido, seguro e sem fila.",
  keywords: ["ingressos", "eventos", "shows", "festas", "teatro", "interior de SP", "sul de MG"],
  authors: [{ name: "Elleva Tickets" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Elleva Tickets",
    title: "Elleva Tickets — Ingressos para os melhores eventos",
    description:
      "Ingressos para shows, festas, esporte e teatro no interior de SP e sul de MG.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elleva Tickets — Ingressos para os melhores eventos",
    description:
      "Ingressos para shows, festas, esporte e teatro no interior de SP e sul de MG.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} antialiased`}>
      <body className="min-h-screen flex flex-col">
        {children}
        <CookieConsent gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
