import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Barras } from "@/components/ui/barras";
import { Button } from "@/components/ui/button";
import { Duotone } from "@/components/ui/duotone";
import { Marquee } from "@/components/ui/marquee";
import { PosterFallback } from "@/components/ui/poster-fallback";
import { CityPills } from "@/components/elleva/city-pills";
import { EventStubRow } from "@/components/elleva/event-stub-row";
import { TicketCard } from "@/components/elleva/ticket-card";

export const metadata: Metadata = {
  title: "Dev · UI — sistema Cartaz de Show",
  robots: { index: false, follow: false },
};

// Página interna de aceite da Fase A (spec §16). Não linkar em produção.

const FOTO_DEMO = "https://picsum.photos/seed/elleva-show/800/500";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t-[1.5px] border-tinta py-10">
      <h2 className="rotulo mb-6 text-sol-escuro">{titulo}</h2>
      {children}
    </section>
  );
}

const SWATCHES = [
  ["papel", "#FAF5EC"],
  ["papel-2", "#F3ECDF"],
  ["tinta", "#141210"],
  ["sol", "#E8481F"],
  ["sol-escuro", "#C93A15"],
  ["cartaz", "#F2B324"],
  ["palco", "#16624A"],
] as const;

export default function DevUiPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24">
      <header className="py-10">
        <p className="rotulo text-sol-escuro">Elleva Tickets · Fase A</p>
        <h1 className="display-1 mt-2">
          Cartaz de <span className="text-sol">show</span>
        </h1>
        <p className="corpo mt-4 max-w-[46ch]">
          Fundação do sistema: tokens, tipografia Archivo (três vozes), geometria
          de ingresso e primitivos. Aceite antes da Fase B.
        </p>
      </header>

      <Secao titulo="Cor — 60/30/10">
        <div className="flex flex-wrap gap-3">
          {SWATCHES.map(([nome, hex]) => (
            <div key={nome} className="w-28">
              <div
                className="h-16 rounded-[var(--radius-card)] border-[1.5px] border-tinta"
                style={{ background: `var(--color-${nome})` }}
              />
              <p className="rotulo mt-1.5">{nome}</p>
              <p className="corpo-suave">{hex}</p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Tipografia — Archivo, três vozes">
        <div className="flex flex-col gap-5">
          <p className="display-1">Display 1 — 900 · 120%</p>
          <p className="display-2">Display 2 — o palco do interior</p>
          <p className="titulo-card">Título de card 900 · wdth 115</p>
          <p className="corpo max-w-[46ch]">
            Corpo 400: shows, festas, teatro e esporte na sua cidade. Sem taxa
            escondida, sem fila, sem drama.
          </p>
          <p className="corpo-suave">Corpo suave 400 — descrições secundárias em tinta-60.</p>
          <p className="rotulo">Rótulo 500 · caps · tracking 0.18em</p>
          <p className="numero text-4xl">R$ 1.234 · 12 JUL</p>
        </div>
      </Secao>

      <Secao titulo="Button — primario / contorno / tinta">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Garantir meu lugar →</Button>
          <Button variante="contorno">Ver agenda</Button>
          <Button variante="tinta">Entrar</Button>
        </div>
        <div className="mt-4 flex items-center gap-4 rounded-[var(--radius-card)] bg-tinta p-4">
          <Button variante="contorno-papel">Contorno sobre tinta</Button>
        </div>
      </Secao>

      <Secao titulo="Badge">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tom="tinta">Show</Badge>
          <Badge tom="papel">Teatro</Badge>
          <Badge tom="sol">Hoje tem</Badge>
          <Badge tom="cartaz" quadrado>Último lote</Badge>
        </div>
      </Secao>

      <Secao titulo="Marquee — pausa no hover, morre com reduced-motion">
        <Marquee
          itens={[
            "Mogi Guaçu",
            "Mogi Mirim",
            "Itapira",
            "Americana",
            "Sul de MG",
            "Hoje tem show",
          ]}
        />
      </Secao>

      <Secao titulo="Barras — código de barras decorativo (aria-hidden)">
        <div className="flex items-center gap-8">
          <Barras />
          <span className="inline-flex rounded-[var(--radius-card)] bg-tinta p-3">
            <Barras cor="bg-papel" />
          </span>
        </div>
      </Secao>

      <Secao titulo="Duotone — tinta→sol / cartaz / palco">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(["sol", "cartaz", "palco"] as const).map((tone) => (
            <div key={tone}>
              <Duotone
                src={FOTO_DEMO}
                alt={`Demonstração duotone ${tone}`}
                tone={tone}
                className="h-40 rounded-[var(--radius-card)] border-[1.5px] border-tinta"
              />
              <p className="rotulo mt-1.5">{tone}</p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="PosterFallback — estado sem foto é linguagem">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-72">
            <PosterFallback
              nome="Uma noite inteira de Rita"
              categoria="SHOW"
              data="12 JUL"
              cidade="Mogi Guaçu"
              numeroSerie="0042"
            />
          </div>
          <div className="h-72">
            <PosterFallback
              nome="Baile do Interior"
              categoria="FESTA"
              data="26 JUL"
              cidade="Itapira"
              numeroSerie="0043"
            />
          </div>
          <div className="h-72">
            <PosterFallback
              nome="Copa Regional de Futsal"
              categoria="ESPORTE"
              data="02 AGO"
              cidade="Americana"
              numeroSerie="0044"
            />
          </div>
        </div>
      </Secao>

      <Secao titulo="TicketCard — notch + picote + sombra dura no hover">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          <TicketCard
            href="#"
            titulo="Uma noite inteira de Rita"
            categoria="SHOW"
            data="Sáb 12 Jul · 19h30"
            local="Teatro Municipal · Mogi Mirim"
            precoDesde={60}
          />
          <TicketCard
            href="#"
            titulo="Baile do Interior"
            categoria="FESTA"
            data="Sáb 26 Jul · 22h"
            local="Espaço Villa · Itapira"
            precoDesde={40}
            cover={FOTO_DEMO}
          />
          <TicketCard
            href="#"
            titulo="Peça: O Auto da Compadecida"
            categoria="TEATRO"
            data="Dom 03 Ago · 20h"
            local="Teatro Rural · Mogi Guaçu"
            precoDesde={35}
            esgotado
          />
        </div>
      </Secao>

      <Secao titulo="EventStubRow + CityPills — papel e modo noite">
        <CityPills
          cidades={[
            { label: "Mogi Guaçu", href: "#", ativa: true },
            { label: "Mogi Mirim", href: "#" },
            { label: "Itapira", href: "#" },
            { label: "Americana", href: "#" },
            { label: "Sul de MG", href: "#" },
          ]}
        />
        <div className="mt-5 flex flex-col gap-3">
          <EventStubRow
            href="#"
            titulo="Uma noite inteira de Rita"
            categoria="SHOW"
            dia="12"
            mes="JUL"
            meta="19h30 · Teatro Municipal · Mogi Mirim"
            precoDesde={60}
          />
          <EventStubRow
            href="#"
            titulo="Copa Regional de Futsal"
            categoria="ESPORTE"
            dia="02"
            mes="AGO"
            meta="16h · Ginásio Azulão · Americana"
            precoDesde={20}
          />
        </div>

        {/* modo noite (spec §14): mesmo componente, wrapper com data-theme */}
        <div
          data-theme="noite"
          className="mt-6 flex flex-col gap-3 rounded-[var(--radius-card)] p-5"
        >
          <p className="rotulo mb-1 text-cartaz">Modo noite · agenda</p>
          <EventStubRow
            href="#"
            titulo="Baile do Interior"
            categoria="FESTA"
            dia="26"
            mes="JUL"
            meta="22h · Espaço Villa · Itapira"
            precoDesde={40}
          />
          <EventStubRow
            href="#"
            titulo="Peça: O Auto da Compadecida"
            categoria="TEATRO"
            dia="03"
            mes="AGO"
            meta="20h · Teatro Rural · Mogi Guaçu"
            precoDesde={35}
            esgotado
          />
          <CityPills
            className="mt-2"
            cidades={[
              { label: "Mogi Guaçu", href: "#", ativa: true },
              { label: "Itapira", href: "#" },
            ]}
          />
        </div>
      </Secao>
    </main>
  );
}
