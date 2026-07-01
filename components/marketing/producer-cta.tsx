import Link from "next/link";
import Magnetic from "@/components/motion/magnetic";

// Cards coloridos flutuantes ao redor da chamada, como no preview v11.
// `par` = deslocamento de parallax (px); sinais alternados dão profundidade.
const CARDS = [
  { emoji: "🎵", grad: "linear-gradient(150deg,#F5793B,#E0492A)", pos: { top: "14%", left: "5%" },   rot: "-12deg", par: 40 },
  { emoji: "🎫", grad: "linear-gradient(150deg,#3B9EF5,#1E6FD6)", pos: { top: "6%",  left: "24%" },  rot: "8deg",   par: -30 },
  { emoji: "🪩", grad: "linear-gradient(150deg,#F5B72B,#E0902A)", pos: { top: "52%", left: "12%" },  rot: "-6deg",  par: 55 },
  { emoji: "🎤", grad: "linear-gradient(150deg,#9B4DF0,#6A28D9)", pos: { top: "10%", right: "6%" },  rot: "10deg",  par: -45 },
  { emoji: "⚡", grad: "linear-gradient(150deg,#17B57A,#0C8557)", pos: { top: "48%", right: "10%" }, rot: "-8deg",  par: 35 },
];

export default function ProducerCTA() {
  return (
    <section className="producer" data-parallax-scope>
      {CARDS.map((c, i) => (
        <span
          key={i}
          className="producer-card-wrap"
          style={{ ...c.pos }}
          data-parallax={c.par}
          aria-hidden="true"
        >
          <span className="producer-card" style={{ transform: `rotate(${c.rot})`, backgroundImage: c.grad }}>
            {c.emoji}
          </span>
        </span>
      ))}

      <div className="producer-inner">
        <h2 className="producer-title" data-reveal-lines>
          Cria. <span className="serif">Divulga.</span> Coloca seu<br />evento no mundo.
        </h2>
        <div data-reveal>
          <Magnetic>
            <Link href="/agenda" className="btn btn-gold btn-lg producer-btn">
              Traga seu evento pra Elleva
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
