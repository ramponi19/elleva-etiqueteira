import sanitizeHtml from "sanitize-html";

// Descrição do evento vem de um editor rich-text (HTML autorado pelo produtor).
// Allowlist conservadora: formatação básica + links seguros; sem script/estilo,
// sem atributos perigosos. Links ganham rel/target e só http(s)/mailto.
const OPTS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "b", "strong", "i", "em", "u", "s", "ul", "ol", "li", "a", "h3", "h4", "blockquote", "span"],
  // rel/target precisam estar na allowlist, senão o sanitize-html REMOVE os que
  // o transformTags adiciona (filtra por allowedAttributes depois do transform)
  // — e os links externos ficariam sem noopener/nofollow (tabnabbing/SEO).
  allowedAttributes: { a: ["href", "rel", "target"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: (_tagName, attribs) => ({
      tagName: "a",
      attribs: { ...attribs, rel: "noopener noreferrer nofollow", target: "_blank" },
    }),
  },
};

/** HTML seguro pra renderizar com dangerouslySetInnerHTML. */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTS);
}

/** Texto puro (sem tags) — pra teasers/snippets e meta description. */
export function toPlainText(html: string | null | undefined, max = 240): string {
  if (!html) return "";
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  return max && text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}
