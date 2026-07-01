import Link from "next/link";

// Cards coloridos flutuantes ao redor da chamada, como no preview v11.
const CARDS = [
  { emoji: "🎵", grad: "linear-gradient(150deg,#F5793B,#E0492A)", pos: { top: "14%", left: "5%" },   rot: "-12deg" },
  { emoji: "🎫", grad: "linear-gradient(150deg,#3B9EF5,#1E6FD6)", pos: { top: "6%",  left: "24%" },  rot: "8deg"   },
  { emoji: "🪩", grad: "linear-gradient(150deg,#F5B72B,#E0902A)", pos: { top: "52%", left: "12%" },  rot: "-6deg"  },
  { emoji: "🎤", grad: "linear-gradient(150deg,#9B4DF0,#6A28D9)", pos: { top: "10%", right: "6%" },  rot: "10deg"  },
  { emoji: "⚡", grad: "linear-gradient(150deg,#17B57A,#0C8557)", pos: { top: "48%", right: "10%" }, rot: "-8deg"  },
];

export default function ProducerCTA() {
  return (
    <section className="producer">
      {CARDS.map((c, i) => (
        <span
          key={i}
          className="producer-card"
          style={{ ...c.pos, transform: `rotate(${c.rot})`, backgroundImage: c.grad }}
          aria-hidden="true"
        >
          {c.emoji}
        </span>
      ))}

      <div className="producer-inner" data-reveal>
        <h2 className="producer-title">
          Cria. <span className="serif">Divulga.</span> Coloca seu<br />evento no mundo.
        </h2>
        <Link href="/agenda" className="btn btn-gold btn-lg producer-btn">
          Traga seu evento pra Elleva
        </Link>
      </div>
    </section>
  );
}
