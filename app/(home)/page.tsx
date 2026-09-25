import { getEvents } from "@/lib/events";
import { getContaResumo } from "@/lib/auth";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";
import HomeClara from "@/components/elleva/home-clara";

export const revalidate = 300;

const JSONLD_SITE = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: "Elleva Tickets", url: SITE_URL, email: "contato@ellevaeventos.com.br" },
    {
      "@type": "WebSite", name: "Elleva Tickets", url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/agenda?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function HomePage() {
  const [events, conta] = await Promise.all([getEvents(), getContaResumo()]);
  return (
    <>
      <JsonLd data={JSONLD_SITE} />
      <HomeClara events={events} conta={conta} />
    </>
  );
}
