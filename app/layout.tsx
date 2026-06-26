import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
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
    default: "Elleva — Gestão de Etiquetas Industriais",
    template: "%s | Elleva",
  },
  description:
    "Plataforma SaaS para gestão completa de etiquetas industriais. Controle modelos, impressoras e jobs de impressão com eficiência.",
  keywords: ["etiquetas industriais", "gestão de etiquetas", "SaaS industrial", "impressão de etiquetas"],
  authors: [{ name: "Elleva" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://elleva.app",
    siteName: "Elleva",
    title: "Elleva — Gestão de Etiquetas Industriais",
    description:
      "Plataforma SaaS para gestão completa de etiquetas industriais.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elleva — Gestão de Etiquetas Industriais",
    description:
      "Plataforma SaaS para gestão completa de etiquetas industriais.",
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
      className={`${inter.variable} ${instrumentSerif.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
