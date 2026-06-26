import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1A2744",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://elleva.app"
  ),
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
    url: "https://elleva.app",
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
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${jakarta.variable} ${jetbrains.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
