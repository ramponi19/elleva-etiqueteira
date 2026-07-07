// Tratamento tinta→sol obrigatório em toda foto de evento (spec §5.1).
// A receita (grayscale + screen sobre tinta + multiply da cor) vive em
// globals.css; aqui só o wrapper com o tom da categoria.
interface DuotoneProps {
  src: string;
  alt: string;
  tone?: "sol" | "cartaz" | "palco";
  className?: string;
}

export function Duotone({ src, alt, tone = "sol", className }: DuotoneProps) {
  return (
    <div className={`duotone ${className ?? ""}`} data-tone={tone}>
      {/* eslint-disable-next-line @next/next/no-img-element -- filter+blend exigem img direta */}
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}
