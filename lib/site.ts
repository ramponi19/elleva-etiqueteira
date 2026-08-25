// URL canônica do site — única fonte pra metadata, sitemap, robots e JSON-LD.
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.ellevaeventos.com.br";

export const CONTATO_EMAIL = "contato@ellevaeventos.com.br";

// Redes sociais — única fonte da verdade. Deixe VAZIO o que ainda não existe:
// o link some do rodapé em vez de apontar pra uma URL quebrada.
//   instagram → só o @ (sem o @), ex.: "ellevaeventos"
//   whatsapp  → número com DDI/DDD só dígitos, ex.: "5519999999999"
export const SOCIAIS = {
  instagram: "",
  whatsapp: "",
} as const;

/** Monta os links sociais que estão realmente configurados. */
export function sociaisLinks(): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  if (SOCIAIS.instagram) out.push({ label: "Instagram", href: `https://instagram.com/${SOCIAIS.instagram}` });
  if (SOCIAIS.whatsapp) out.push({ label: "WhatsApp", href: `https://wa.me/${SOCIAIS.whatsapp}` });
  return out;
}
