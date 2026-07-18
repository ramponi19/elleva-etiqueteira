// Dados estruturados schema.org como <script> nativo (guia json-ld do Next).
// O replace escapa "<" pra JSON.stringify não abrir brecha de XSS no HTML.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
