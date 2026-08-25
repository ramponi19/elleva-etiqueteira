import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * REGIÃO DO SERVIDOR: `regions: ["gru1"]` fica em `vercel.json` (São Paulo).
 *
 * O comentário mora aqui porque o `vercel.json` rejeita qualquer chave fora do
 * schema — nem `//` passa — e essa decisão não pode se perder: o Supabase deste
 * projeto está em `sa-east-1` (São Paulo) e a Vercel roda o servidor em `iad1`
 * (Virgínia) por padrão. Cada tela faz várias consultas em sequência, então a
 * distância é paga várias vezes por página. Se alguém mudar a região de um lado,
 * mude do outro — as duas andam juntas.
 */

// Content-Security-Policy (M1): segunda barreira contra injeção de script (o C2
// já é barrado na origem). Restringe DE ONDE scripts/estilos/conexões podem vir —
// libera só o que o app usa de fato: Mercado Pago (checkout transparente),
// Meta/GA (tracking por evento), Google Fonts, Supabase e o túnel do Sentry
// (que é same-origin, coberto por 'self'). 'unsafe-inline' em script é
// necessário pro Next (hydration) e pros snippets de fbq/gtag.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://sdk.mercadopago.com https://http2.mlstatic.com https://www.mercadopago.com https://connect.facebook.net https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://*.mercadopago.com https://www.google-analytics.com https://*.facebook.com https://*.ingest.us.sentry.io",
  "frame-src 'self' https://*.mercadopago.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false, // não anuncia "X-Powered-By: Next.js"
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" }, // capas mock
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // camera=(self): o scanner de QR do check-in (portaria) usa a
            // câmera do celular — bloquear aqui mata a validação de ingresso.
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

/**
 * SENTRY. Envolve a config pra subir os source maps: sem eles o erro chega como
 * uma linha de código minificado e não serve pra nada.
 *
 * `silent` fora de CI pra não encher o terminal; o upload só acontece quando
 * SENTRY_AUTH_TOKEN existe (produção), então `npm run build` local segue igual.
 */
export default withSentryConfig(nextConfig, {
  org: "ramponi19",
  project: "elleva-tickets",
  silent: !process.env.CI,
  // O túnel evita que bloqueador de anúncio engula o relatório — o navio afunda
  // calado justamente em quem usa extensão de bloqueio.
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
});
