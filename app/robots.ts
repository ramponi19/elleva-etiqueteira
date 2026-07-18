import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Só o marketing é indexável; áreas logadas, fluxos e utilitários ficam fora.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/produtor",
        "/conta",
        "/checkout",
        "/criar-evento",
        "/meus-eventos",
        "/validar",
        "/api/",
        "/dev/",
        "/callback",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
