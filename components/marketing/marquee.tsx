// Faixa "ticker" correndo — assinatura visual, no clima do ingresso.
// Animação em CSS puro (respeita prefers-reduced-motion no globals.css).
const ITEMS = ["Shows", "Festas", "Esporte", "Teatro", "Corporativo", "Cursos"];

export default function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {[0, 1].map((g) => (
          <div className="marquee__group" key={g}>
            {ITEMS.map((it, i) => (
              <span className="marquee__item" key={i}>
                {it}
                <span className="marquee__sep">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
