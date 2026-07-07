import Image from "next/image";

// Tratamento tinta→sol obrigatório em toda foto de evento (spec §5.1).
// A receita (grayscale + screen sobre tinta + multiply da cor) vive em
// globals.css; aqui o wrapper com o tom da categoria. Usa next/image
// (fill) pra servir AVIF/WebP redimensionado — o filter/blend do CSS
// aplica no <img> renderizado do mesmo jeito.
interface DuotoneProps {
  src: string;
  alt: string;
  tone?: "sol" | "cartaz" | "palco";
  className?: string;
  /** true na imagem LCP (cartaz da página de evento) */
  priority?: boolean;
  /** dica de tamanho pro srcset, ex. "(max-width: 640px) 100vw, 33vw" */
  sizes?: string;
}

export function Duotone({
  src,
  alt,
  tone = "sol",
  className,
  priority,
  sizes = "(max-width: 640px) 100vw, 50vw",
}: DuotoneProps) {
  return (
    <div className={`duotone ${className ?? ""}`} data-tone={tone}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} />
    </div>
  );
}
