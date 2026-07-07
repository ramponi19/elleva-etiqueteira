import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getEvent } from "@/lib/events";
import { arteDaCategoria, numeroSerie, type Tone } from "@/lib/arte";
import { cidadeDoEvento } from "@/lib/cidades";
import { fmtBRL } from "@/lib/format";

// OG image dinâmica (spec §10): todo link compartilhado no WhatsApp chega
// como mini-cartaz — 1200×630 na cor de arte da categoria, tipografia de
// pôster, notches e nº de série.

// Satori não lê CSS vars: paleta em hex (mesmos valores de globals.css)
const HEX = {
  papel: "#FAF5EC",
  papel2: "#F3ECDF",
  tinta: "#141210",
  sol: "#E8481F",
  cartaz: "#F2B324",
  palco: "#16624A",
};
const TONE_BG: Record<Tone, string> = {
  sol: HEX.sol, cartaz: HEX.cartaz, palco: HEX.palco, tinta: HEX.tinta, papel: HEX.papel2,
};
const TONE_FG: Record<Tone, string> = {
  sol: HEX.papel, cartaz: HEX.tinta, palco: HEX.papel, tinta: HEX.papel, papel: HEX.tinta,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const data = await getEvent(slug);
  if (!data) return new Response("Evento não encontrado", { status: 404 });
  const { event } = data;

  const arte = arteDaCategoria(event.catLabel);
  const bg = TONE_BG[arte.tone];
  const fg = TONE_FG[arte.tone];
  const cidade = cidadeDoEvento(event);

  const [black, medium] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/fonts/archivo-black.ttf")),
    readFile(path.join(process.cwd(), "assets/fonts/archivo-medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: bg,
          color: fg,
          padding: "56px 88px",
          position: "relative",
          fontFamily: "ArchivoMedium",
        }}
      >
        {/* notches — furos do picote nas laterais */}
        <div style={{ position: "absolute", left: -28, top: 275, width: 56, height: 56, borderRadius: 999, background: "#fff", display: "flex" }} />
        <div style={{ position: "absolute", right: -28, top: 275, width: 56, height: 56, borderRadius: 999, background: "#fff", display: "flex" }} />

        {/* topo: marca + cidade | nº de série */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, textTransform: "uppercase" }}>
            ELLEVA · {cidade}
          </div>
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, opacity: 0.8 }}>
            Nº {numeroSerie(event.serial)}
          </div>
        </div>

        {/* nome do evento — tipografia de cartaz */}
        <div
          style={{
            display: "flex",
            fontFamily: "ArchivoBlack",
            fontSize: event.title.length > 28 ? 72 : 88,
            lineHeight: 0.98,
            textTransform: "uppercase",
            maxWidth: 1000,
          }}
        >
          {event.title}
        </div>

        {/* base: régua + data · hora · preço */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 3, width: "100%", background: fg, marginBottom: 24 }} />
          <div style={{ display: "flex", fontSize: 34, letterSpacing: 3, textTransform: "uppercase" }}>
            {event.dateFull} · {event.time}
            {event.priceFrom > 0 ? ` · a partir de ${fmtBRL(event.priceFrom)}` : ""}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "ArchivoBlack", data: black, style: "normal", weight: 900 },
        { name: "ArchivoMedium", data: medium, style: "normal", weight: 500 },
      ],
    }
  );
}
