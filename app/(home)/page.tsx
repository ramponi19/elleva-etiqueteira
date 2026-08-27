import { getEvents } from "@/lib/events";
import { getAuth } from "@/lib/auth";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";
import HomeNoite from "@/components/elleva/home-noite";

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
  const [events, { user }] = await Promise.all([getEvents(), getAuth()]);
  return (
    <>
      <JsonLd data={JSONLD_SITE} />
      <HomeNoite events={events} loggedIn={!!user} />
    </>
  );
}
