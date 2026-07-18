import type { Metadata } from "next";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { becomeProducerAndGo } from "@/lib/actions/producer";

export const metadata: Metadata = {
  title: "Para produtores — venda ingressos na Elleva",
  description:
    "Publique seu evento, venda com Pix na hora e controle a portaria com QR code. A bilheteria oficial do interior de SP e sul de MG.",
};

// Landing de produtores (Fase D) — mesma jornada do bloco da home, expandida:
// publica → vende → controla, tudo com recursos que já existem no produto.
const PASSOS = [
  {
    n: "01",
    icon: "lucide:megaphone",
    t: "Publica",
    d: "Cadastra o evento em minutos: lotes, preços, capacidade e a arte do cartaz. A página do evento já nasce pronta pra compartilhar.",
  },
  {
    n: "02",
    icon: "lucide:qr-code",
    t: "Vende",
    d: "O público paga com Pix e recebe o ingresso por e-mail na hora, com QR code único. Sem boleto, sem espera.",
  },
  {
    n: "03",
    icon: "lucide:scan-line",
    t: "Controla",
    d: "Acompanha as vendas em tempo real e valida a entrada pelo celular. O QR só passa uma vez — nada de ingresso duplicado.",
  },
];

const RECURSOS = [
  {
    icon: "lucide:zap",
    t: "Pix direto na conta",
    d: "Pagamento processado pelo Mercado Pago, com confirmação automática do pedido.",
  },
  {
    icon: "lucide:users",
    t: "Portaria sem login",
    d: "Gera um link de check-in pra equipe da portaria validar ingressos sem precisar de conta.",
  },
  {
    icon: "lucide:line-chart",
    t: "Painel de vendas",
    d: "Vendas por lote, receita e relatório de check-in em um painel só seu.",
  },
  {
    icon: "lucide:map-pin",
    t: "Divulgação regional",
    d: "Seu evento entra na agenda da região — interior de SP e sul de MG — onde o público já procura.",
  },
];

export default function ProdutoresPage() {
  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-[1320px] px-5 pb-4 pt-14 sm:px-10 sm:pt-20">
        <p className="rotulo m-0 text-sol-escuro">Pra quem faz o evento</p>
        <h1 className="display-1 mt-4 max-w-[15ch]">
          Faça seu evento <span className="text-sol">lotar</span>
        </h1>
        <p className="corpo mt-5 max-w-[48ch]">
          Publica na Elleva, vende com Pix na hora e controla a portaria pelo
          celular. A bilheteria oficial do interior cuida do resto.
        </p>
        <form action={becomeProducerAndGo} className="mt-7">
          <input type="hidden" name="to" value="/criar-evento" />
          {/* variante tinta: o primario da viewport do topo é o "Entrar" da nav */}
          <Button type="submit" variante="tinta">
            Publicar evento na Elleva →
          </Button>
        </form>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-[1320px] px-5 pb-6 pt-14 sm:px-10">
        <h2 className="display-2" data-reveal>
          Como funciona
        </h2>
        <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PASSOS.map((p) => (
            <article
              key={p.n}
              data-reveal
              className="flex flex-col gap-3 rounded-[var(--radius-card)] border-[1.5px] border-tinta p-6"
            >
              <div className="flex items-center justify-between">
                <Icon icon={p.icon} className="text-sol-escuro" style={{ fontSize: 26 }} />
                <span className="numero text-[22px] text-tinta-35">{p.n}</span>
              </div>
              <h3 className="m-0 text-[20px] font-extrabold text-tinta">{p.t}</h3>
              <p className="corpo-suave m-0">{p.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* RECURSOS — bloco tinta full-width */}
      <section className="mt-16 bg-tinta py-16 sm:py-20">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-10">
          <h2 className="display-2 max-w-[18ch] text-papel" data-reveal>
            Ferramenta de <span className="text-cartaz">bilheteria completa</span>
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {RECURSOS.map((r) => (
              <div key={r.t} data-reveal className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--color-papel-inv)] text-cartaz">
                  <Icon icon={r.icon} style={{ fontSize: 20 }} />
                </span>
                <div>
                  <h3 className="m-0 text-[17px] font-extrabold text-papel">{r.t}</h3>
                  <p className="m-0 mt-1.5 text-[14.5px] leading-relaxed text-papel/70">{r.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto flex max-w-[1320px] flex-col items-start gap-6 px-5 py-16 sm:px-10 sm:py-20">
        <h2 className="display-2 max-w-[16ch]" data-reveal>
          Seu evento merece <span className="text-sol">casa cheia</span>
        </h2>
        <p className="corpo max-w-[46ch]">
          Cria a conta, publica o evento e começa a vender hoje. Qualquer dúvida,
          a Central de Ajuda e o nosso time estão a um clique.
        </p>
        <form action={becomeProducerAndGo}>
          <input type="hidden" name="to" value="/criar-evento" />
          <Button type="submit">Começar agora →</Button>
        </form>
      </section>
    </>
  );
}
