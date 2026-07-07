// Faixa de cartaz (spec §7): tinta, rótulo em papel, separador ✶, loop CSS
// infinito com conteúdo duplicado. Pausa no hover; some com reduced-motion
// (via CSS em globals.css).
interface MarqueeProps {
  itens: string[];
  className?: string;
}

export function Marquee({ itens, className }: MarqueeProps) {
  const sequencia = (
    <span className="inline-flex items-center">
      {itens.map((item) => (
        <span key={item} className="inline-flex items-center">
          <span className="rotulo tracking-[2.5px] px-5 py-2.5">{item}</span>
          <span aria-hidden className="text-sol">✶</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className={`marquee ${className ?? ""}`}>
      <div className="marquee__track">
        {sequencia}
        {/* cópia pro loop perfeito — invisível pra leitores de tela */}
        <span aria-hidden>{sequencia}</span>
      </div>
    </div>
  );
}
