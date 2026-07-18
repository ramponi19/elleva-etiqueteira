import type { MetadataRoute } from "next";
import { getEvents } from "@/lib/events";
import { CIDADES } from "@/lib/cidades";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getEvents();
  const agora = new Date();

  const fixas: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: agora, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/agenda`, lastModified: agora, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/produtores`, lastModified: agora, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/ajuda`, lastModified: agora, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/terms`, lastModified: agora, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: agora, changeFrequency: "yearly", priority: 0.2 },
  ];

  const cidades: MetadataRoute.Sitemap = CIDADES.map((c) => ({
    url: `${SITE_URL}/agenda/${c.slug}`,
    lastModified: agora,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const eventos: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${SITE_URL}/evento/${e.id}`,
    lastModified: agora,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...fixas, ...cidades, ...eventos];
}
