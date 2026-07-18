# ELLEVA TICKETS — Spec de Remodelação Nível 3 · Conceito "Cartaz de Show"
> Documento de handoff para Claude Code. Projeto: `elleva-etiqueteira` (GitHub + Supabase + Vercel).
> Site em produção: `elleva-tickets.vercel.app` · Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4, Supabase, Vercel.
> Este documento substitui integralmente a identidade visual atual (Fraunces / Plus Jakarta Sans / JetBrains Mono / cinza+pastéis). Nada da identidade antiga sobrevive.
---
## 0. Como usar este documento
Execute na ordem das Fases A → D (seção 16). Cada fase termina com deploy funcional na Vercel e possui critérios de aceite verificáveis. Em caso de dúvida entre duas soluções, escolha a que estiver mais próxima dos princípios da seção 1. Nunca introduza cores, fontes ou padrões fora deste documento sem registrar a decisão em `docs/decisoes.md`.
---
## 1. Conceito e princípios
**Posicionamento:** a Elleva é a bilheteria oficial do interior de SP e sul de MG (Mogi Guaçu, Mogi Mirim, Itapira, Americana e região). Quente, próxima, com energia de cartaz de show colado no poste — o oposto do SaaS frio de capital.
**Três pilares visuais:**
1. **Tipografia de pôster** — grotesca condensada/expandida, pesada, em caps, como lambe-lambe e cartaz de circo.
2. **O ingresso como gramática** — recortes laterais (furos do picote), linha tracejada separando "arte" do "canhoto", número de série, código de barras decorativo. A Elleva vende ingressos; o ingresso é a forma.
3. **Duotone como sistema de imagem** — toda foto passa por tratamento tinta→sol. Foto ruim de organizador vira ativo de marca. Sem foto, o fallback é um pôster tipográfico gerado — nunca um retângulo vazio.
**Regras anti-template (invioláveis):**
- PROIBIDO: fontes serifadas no display (Fraunces, Instrument Serif, Playfair etc.), itálico como ênfase decorativa, fontes monoespaçadas em rótulos, emojis como decoração de UI, cards flutuantes rotacionados com ícones, gradientes, glassmorphism, sombras difusas grandes, pastéis aleatórios, texto cinza-claro sobre branco em headlines.
- O que diferencia este design do cluster genérico "creme + terracota": display grotesco em caps (nunca serifa), bordas de tinta sólidas de 1.5px em todos os cards, a geometria de ingresso (picote/notch) como assinatura, e fotografia duotone. Se algum componente ficar parecido com um template de landing page de IA, ele está errado — volte a estes quatro elementos.
- Gaste a ousadia num lugar só por tela: a assinatura é o ingresso. Todo o resto fica quieto e disciplinado.
---
## 2. Design tokens (Tailwind v4)
Arquivo `app/globals.css` — Tailwind v4 usa `@theme` no CSS, não `tailwind.config`:
```css
@import "tailwindcss";
@theme {
  /* ===== COR ===== */
  --color-papel: #FAF5EC;        /* fundo dominante (60%) */
  --color-papel-2: #F3ECDF;      /* papel sombreado: hovers, zebra, inputs */
  --color-tinta: #141210;        /* texto, bordas, blocos de contraste (30%) */
  --color-tinta-60: rgb(20 18 16 / 0.6);
  --color-tinta-35: rgb(20 18 16 / 0.35);
  --color-sol: #E8481F;          /* A cor da Elleva (10%): CTAs, datas, links */
  --color-sol-escuro: #C93A15;   /* sol para texto pequeno sobre papel (AA 4.5:1) */
  --color-cartaz: #F2B324;       /* apoio: fundo de card por categoria, destaques */
  --color-palco: #16624A;        /* apoio: fundo de card por categoria */
  --color-papel-inv: rgb(250 245 236 / 0.18); /* bordas sobre tinta (modo noite) */
  /* ===== TIPOGRAFIA ===== */
  --font-sans: "Archivo", system-ui, sans-serif;
  /* ===== FORMA ===== */
  --radius-card: 14px;
  --radius-pill: 999px;
  --border-width-tinta: 1.5px;
  /* ===== MOTION ===== */
  --ease-mola: cubic-bezier(0.34, 1.56, 0.64, 1); /* overshoot: rasgo do ingresso, hovers */
  --dur-micro: 150ms;
  --dur-base: 300ms;
  --dur-rasgo: 600ms;
}
```
**Regra 60/30/10:** papel domina o fundo, tinta estrutura (texto + bordas 1.5px + blocos), sol acende só o que precisa gritar. Cartaz e palco aparecem exclusivamente como fundo de arte de card/pôster por categoria — nunca soltos em botões ou textos.
**Mapeamento categoria → cor de arte** (fundo do pôster/card quando não há foto):
| Categoria | Cor de arte | Texto sobre a arte |
|---|---|---|
| show, música | sol `#E8481F` | papel |
| festa, balada | cartaz `#F2B324` | tinta |
| esporte | palco `#16624A` | papel |
| teatro, cultura | tinta `#141210` | papel |
| corporativo, feira | papel-2 `#F3ECDF` com borda tinta | tinta |
---
## 3. Tipografia — Archivo Variable (uma família, três vozes)
Google Fonts, eixos `wdth 62–125` e `wght 100–900`. Carregar via `next/font/google` com `axes: ["wdth"]`, `display: swap`, subset latin. Remover Fraunces, Plus Jakarta Sans e JetBrains Mono do projeto inteiro (inclusive do `layout.tsx` e de qualquer `@font-face` residual).
```ts
// app/fonts.ts
import { Archivo } from "next/font/google";
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
```
**Escala tipográfica** (classes utilitárias a criar em `globals.css` com `@utility` ou componentes de texto):
| Papel | Uso | Especificação |
|---|---|---|
| `display-1` | Hero da home, título do cartaz de evento | 900 · wdth 120% · caps · line-height 0.92 · tracking -0.01em · clamp(44px, 7vw, 88px) |
| `display-2` | Títulos de seção, CTA final | 900 · wdth 118% · caps · lh 0.95 · clamp(28px, 4vw, 44px) |
| `titulo-card` | Nome do evento em cards | 900 · wdth 115% · caps · lh 1 · 17–20px |
| `corpo` | Texto corrido | 400 · wdth 100% · lh 1.55 · 15–16px · cor tinta |
| `corpo-suave` | Descrições secundárias | 400 · lh 1.5 · 13–14px · tinta-60 |
| `rotulo` | Eyebrows, datas, badges, micro-rótulos | 500 · caps · tracking 0.18em · 10.5–12px (substitui o antigo monospace) |
| `numero` | Datas grandes, preços, contadores | 900 · wdth 115% · tabular-nums |
Regras: caps só em display, títulos de card e rótulos — nunca em corpo. Apenas pesos 400, 500 e 900 (nada de 600/700). Itálico proibido.
---
## 4. Cor — combinações e acessibilidade
Pares aprovados (contraste WCAG verificado):
| Fundo | Texto | Contraste | Uso permitido |
|---|---|---|---|
| papel | tinta | ~17:1 | tudo |
| papel | sol-escuro `#C93A15` | ~4.8:1 | links, datas e rótulos em texto pequeno |
| papel | sol `#E8481F` | ~3.6:1 | SOMENTE display/títulos ≥19px peso 900 |
| sol | tinta | ~4.8:1 | botões e badges (padrão acessível) |
| sol | papel | ~3.6:1 | SOMENTE tipografia display ≥19px 900 (arte de pôster) |
| tinta | papel | ~15:1 | modo noite, footer, blocos |
| tinta | cartaz | ~9:1 | destaques no modo noite |
| cartaz | tinta | ~9:1 | badges, canhoto de data |
| palco | papel | ~6.8:1 | arte de card esporte |
Regra prática: **texto pequeno laranja usa sempre `sol-escuro`; texto pequeno sobre laranja usa sempre `tinta`.** O par sol+papel fica reservado à tipografia de cartaz, onde o tamanho garante legibilidade.
---
## 5. Sistema de imagem
### 5.1 Duotone obrigatório (tinta → sol)
Toda foto de evento renderiza dentro de `<Duotone>`. Receita CSS (custo zero, sem processamento server-side):
```css
.duotone { position: relative; overflow: hidden; background: var(--color-tinta); }
.duotone img {
  display: block; width: 100%; height: 100%; object-fit: cover;
  filter: grayscale(1) contrast(1.15) brightness(1.05);
  mix-blend-mode: screen; /* sombras afundam na tinta */
}
.duotone::after {
  content: ""; position: absolute; inset: 0;
  background: var(--color-sol);
  mix-blend-mode: multiply; /* altas luzes ganham o laranja */
  pointer-events: none;
}
```
Variantes: `data-tone="cartaz"` e `data-tone="palco"` trocam a cor do `::after` conforme a categoria. Resultado: qualquer upload, mesmo foto de celular ruim, sai uniformizado na marca.
### 5.2 PosterFallback (estado sem foto)
Componente `<PosterFallback nome categoria data cidade numeroSerie>`: fundo na cor de arte da categoria, nome do evento em `display-2` quebrando naturalmente, rótulo de categoria no topo esquerdo, `Nº {serie}` no topo direito, faixa inferior com data grande + cidade separadas por régua de 1.5px. É o mesmo layout do cartaz da página de evento em miniatura — o "estado vazio" é linguagem, não vergonha. Número de série = `String(event.id_sequencial).padStart(4, "0")`.
---
## 6. Geometria de ingresso (assinatura visual)
- **Notch (furo do picote):** círculos de 16–18px com a cor do fundo da página, posicionados absolutos nas bordas do card na altura da linha do picote. Em cards sobre papel, o notch é papel com borda tinta 1.5px; sobre tinta (modo noite), é tinta.
- **Picote:** `border-top: 1.5px dashed var(--color-tinta)` (ou papel-inv no modo noite). Separa sempre "arte" (em cima) de "canhoto" com dados frios (embaixo): data, local, preço.
- **Código de barras decorativo:** componente `<Barras>` — 10–14 `<span>` de larguras variadas (1.5–4px) e 16px de altura, cor tinta, `aria-hidden`. Usado no ingresso digital e na confirmação. Nunca gerar barcode real fake.
- **Número de série:** presente no cartaz do evento, no ingresso e na OG image.
---
## 7. Componentes
Todos em `components/ui/` (primitivos) e `components/elleva/` (compostos). Especificações:
### Button
- `primario`: fundo sol, texto tinta 500, pill, padding 12px 22px, hover escurece p/ sol-escuro com `--dur-micro`, active `scale(0.98)`.
- `contorno`: transparente, borda tinta 1.5px, texto tinta; hover fundo papel-2.
- `tinta`: fundo tinta, texto papel (para uso sobre papel).
- Foco visível: `outline: 2px solid var(--color-sol-escuro); outline-offset: 2px` em todos.
- Máximo UM botão `primario` por viewport.
### Badge
Pill ou retângulo 4px, `rotulo`, combinações da seção 4. Categoria de evento: fundo tinta + texto papel (sobre arte clara) ou fundo papel + texto tinta (sobre arte escura).
### Marquee
Faixa tinta, texto papel `rotulo` tracking 2.5px, separador `✶`, animação CSS `translateX` linear infinita (~30s), conteúdo duplicado para loop perfeito, pausa em `:hover` e desliga com `prefers-reduced-motion`. Conteúdo da home: cidades atendidas + "HOJE TEM SHOW". Na página de evento vira ticker de escassez (seção 11).
### TicketCard (card de evento em grids)
Estrutura: wrapper `border: 1.5px solid tinta; border-radius: var(--radius-card); overflow: hidden; background: white` → área de arte (Duotone ou PosterFallback, altura 160–200px, badge de categoria no topo, `titulo-card` ancorado embaixo) → notches nas laterais na altura do picote → canhoto com picote dashed: linha 1 data em `rotulo` sol-escuro, linha 2 local em `corpo-suave` tinta, linha 3 "a partir de R$ X" 500 + seta sol à direita. Hover: card sobe 4px e o canhoto "levanta" 2px extras com `--ease-mola`; borda ganha sombra dura `4px 4px 0 var(--color-tinta)` (sombra offset sólida, nunca blur).
### EventStubRow (linha de agenda)
Bloco de data à esquerda (64px, cor de arte da categoria, dia em `numero` 22px + mês `rotulo`), picote vertical dashed, conteúdo (título `titulo-card` 15px, metadados `corpo-suave`), preço à direita. Ver mock do modo noite.
### CityPills
Pills de filtro: ativa = fundo sol texto papel-ou-tinta conforme seção 4 (usar tinta), inativas = borda 1px, hover preenche papel-2/papel-inv.
### CanhotoCheckout (coluna de compra na página de evento)
Borda esquerda `2px dashed tinta` separando do cartaz. Blocos de lote: borda tinta 1.5px, radius 10px, nome + preço (meia em tinta-60), stepper circular −/+ (o + preenchido tinta). Lote esgotado: opacity 0.55 + badge "SOLD OUT". Total após picote dashed. CTA primário "Garantir meu lugar →". Microcopy: "Pix aprovado na hora · ingresso no WhatsApp".
### FaixaLGPD
Tirinha fixa na base: fundo papel, borda superior tinta 1.5px, texto `corpo-suave` de uma linha ("A Elleva usa cookies pra melhorar sua experiência.") + link "Preferências" + botões "Aceitar" (tinta) e "Só o essencial" (contorno). Nunca modal bloqueante. Guarda consentimento em cookie e condiciona o disparo dos pixels (seção 13).
### Footer
Fundo tinta, logo, colunas de links, régua papel-inv, assinatura `rotulo`: "© 2026 ELLEVA TICKETS · INTERIOR DE SP · SUL DE MG".
---
## 8. Páginas
### 8.1 Home `/`
1. Navbar papel, borda inferior tinta 1.5px: logo (ícone ticket sol + ELLEVA 900 wdth 115%) · Agenda · Cidades · Produtores · botão Entrar (primario).
2. Marquee de cidades.
3. Hero alinhado à esquerda: eyebrow `rotulo` sol-escuro "BILHETERIA OFICIAL · INTERIOR DE SP E SUL DE MG" → `display-1` "O PALCO DO **INTERIOR** É AQUI" (palavra "interior" em sol) → subtítulo corpo, máx. 46ch: "Shows, festas, teatro e esporte na sua cidade. Sem taxa escondida, sem fila, sem drama." → busca pill (input + botão tinta com ícone).
4. Grid de TicketCards "Em cartaz" (auto-fit minmax 280px), link "Ver agenda →" em sol-escuro.
5. Seção produtores: bloco tinta full-width, `display-2` papel "SEU EVENTO MERECE **CASA CHEIA**" (destaque em cartaz), CTA primario "Publicar evento na Elleva →".
6. Footer.
**Deletar sem substituição:** seção dos emojis flutuantes, carrossel pastel do hero atual, headline "Todo evento que importa,".
### 8.2 Agenda `/agenda` e `/agenda/[cidade]`
Header `display-2` "HOJE TEM EM **{CIDADE}**" + CityPills (Mogi Guaçu, Mogi Mirim, Itapira, Americana, Sul de MG) + lista de EventStubRow agrupada por mês. Rotas estáticas por cidade (SEO local: title "Agenda de eventos em {Cidade} | Elleva Tickets"). Suporta o modo noite (seção 14).
### 8.3 Evento `/evento/[slug]`
Grid 1.35fr / 1fr (empilha no mobile, cartaz primeiro):
- **Cartaz** (esquerda): cor de arte ou Duotone da foto, badge categoria + `Nº {serie}`, nome em `display-1` reduzido, descrição curta, faixa inferior com data `numero` + cidade `rotulo`, notches na borda direita.
- **CanhotoCheckout** (direita): data/hora `rotulo` sol-escuro, local + endereço + link "ver no mapa", lotes, total, CTA, microcopy Pix/WhatsApp.
- Abaixo: descrição longa, mapa embed, política de meia, organizador.
- Ticker de escassez no rodapé do cartaz: "RESTAM {n} INGRESSOS ✶ {m} PESSOAS JÁ GARANTIRAM" (dados reais, seção 11; ocultar quando n > 50 — escassez só quando verdadeira).
### 8.4 Checkout `/checkout` e Confirmação
Checkout: uma coluna, resumo em formato de ingresso, formulário mínimo (nome, e-mail, WhatsApp, CPF p/ meia), Pix como método primário via Stripe. Confirmação: fundo tinta, `rotulo` cartaz "PIX APROVADO", `display-2` papel "LUGAR GARANTIDO!", ingresso papel levemente rotacionado (-1.5°) com canhoto separado (+2°) e `<Barras>`, animação do rasgo (seção 9), botões "Receber no WhatsApp" (primario) e "Adicionar à carteira" (contorno-papel).
### 8.5 Produtores `/produtores`
Landing B2B no mesmo sistema: display "CASA CHEIA NÃO É SORTE.", 3 argumentos (repasse rápido, divulgação regional, check-in pelo celular) em cards com borda tinta, CTA para cadastro.
---
## 9. Motion (Framer Motion)
- **Rasgo do ingresso** (confirmação): ingresso inteiro entra com scale 0.9→1; após 400ms o canhoto separa — `y: 14, rotate: 2.5, transition: { type: "spring", stiffness: 280, damping: 14 }` — com um risco dashed revelado entre as partes.
- **Hover TicketCard:** `y: -4` + sombra dura, canhoto `y: -2` extra, `--ease-mola`, 200ms.
- **Reveal de seção:** fade + `y: 16→0` uma vez, threshold 0.2. Sem parallax, sem stagger em tudo.
- **Marquee:** CSS puro.
- **`prefers-reduced-motion: reduce`:** desliga marquee, rasgo vira crossfade, reveals viram opacidade simples. Obrigatório.
---
## 10. OG image dinâmica (`@vercel/og`)
Rota `app/api/og/evento/[slug]/route.tsx` gerando 1200×630 no runtime edge: fundo na cor de arte da categoria, `ELLEVA · {CIDADE}` no topo (Archivo 500 caps tracking), nome do evento Archivo 900 caps ~88px lh 0.95, régua + "DOM 12 JUL · 19H30 · a partir de R$ 60" na base, dois notches (círculos brancos) nas laterais, `Nº {serie}` no canto. Carregar Archivo via `fetch` do arquivo .ttf em `assets/`. Referenciar em `generateMetadata` de `/evento/[slug]` (`openGraph.images` + `twitter.card: summary_large_image`). Todo link compartilhado no WhatsApp chega como mini-cartaz — teste com o debugger do WhatsApp/Meta.
---
## 11. Realtime — escassez verdadeira (Supabase)
- View/coluna `tickets_remaining` por evento, decrementada por trigger na confirmação de pedido.
- No client: canal `postgres_changes` filtrado por `event_id` atualiza o ticker sem refresh.
- Contador "{m} pessoas já garantiram" = count real de ingressos emitidos.
- Regras de honestidade: ocultar escassez quando restam >50; nunca inventar números; "últimos lotes" só quando o último lote está ativo.
## 11.1 Schema alvo (o produto pivotou de etiquetas para tickets)
O schema antigo (`label_templates`, `printers`, `print_jobs`) não se aplica mais. Migrar para:
```sql
-- organizations (produtores) e profiles já existem; manter RLS multi-tenant
create table venues (id uuid primary key default gen_random_uuid(),
  name text not null, address text, city text not null, state text not null);
create table events (id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations not null,
  serial serial, slug text unique not null, name text not null,
  category text not null check (category in ('show','festa','esporte','teatro','corporativo','festival')),
  description text, starts_at timestamptz not null,
  venue_id uuid references venues, cover_url text,
  status text default 'draft' check (status in ('draft','published','sold_out','past')));
create table ticket_types (id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null, name text not null,
  price_cents int not null, half_price boolean default true,
  quantity int not null, sold int default 0, active boolean default true);
create table orders (id uuid primary key default gen_random_uuid(),
  event_id uuid references events not null, buyer_profile uuid references profiles,
  buyer_name text, buyer_email text, buyer_whatsapp text,
  total_cents int not null, status text default 'pending'
    check (status in ('pending','paid','cancelled','refunded')),
  stripe_payment_intent text, created_at timestamptz default now());
create table tickets (id uuid primary key default gen_random_uuid(),
  order_id uuid references orders not null, ticket_type_id uuid references ticket_types not null,
  code text unique not null, checked_in_at timestamptz);
```
RLS: leitura pública de `events`/`ticket_types`/`venues` publicados; escrita restrita à `org_id` do produtor; `orders`/`tickets` visíveis só ao comprador e ao organizador do evento. Webhook Stripe (`/api/webhooks/stripe`) confirma pagamento → gera `tickets` → dispara entrega no WhatsApp (fase posterior: API do WhatsApp; provisório: e-mail via Resend + link).
---
## 12. SEO e metadata
- `generateMetadata` em todas as rotas: title pattern "{Evento} em {Cidade} · {data} | Elleva Tickets"; description com local e preço "a partir de".
- Canonical, `sitemap.ts` dinâmico (eventos publicados + cidades), `robots.ts`.
- JSON-LD `Event` (schema.org) em cada página de evento: name, startDate, location, offers (price/availability), organizer — habilita rich results do Google.
- OG/Twitter via seção 10. `lang="pt-BR"` no html.
---
## 13. LGPD + analytics
- FaixaLGPD (seção 7) gerencia consentimento; GTM só injeta após aceite (Google Consent Mode v2).
- GA4 + Meta Pixel via GTM. Eventos mínimos: `view_event`, `add_to_cart` (lote selecionado), `begin_checkout`, `purchase` (com value). TikTok Pixel: preparar slot no GTM, ativar depois.
- Página `/privacidade` e `/politica-de-compras` reais (o footer já as promete).
---
## 14. Modo noite ("noite de show")
Não é toggle global de SaaS: a **agenda** e páginas de descoberta noturna invertem para tinta como fundo. Implementação: `data-theme="noite"` no wrapper da rota, com variáveis re-mapeadas (`fundo: tinta; texto: papel; borda: papel-inv; hover: rgba(papel, .06)`). Sol e cartaz permanecem os mesmos (funcionam nos dois fundos). Home e checkout permanecem papel. Ícone de lua em cartaz no navbar da agenda como marcador, não como botão.
---
## 15. Guia de copy — a voz da bilheteria
**Tom:** direto, quente, de quem conhece a cidade. Zero corporativês. Frases curtas. Verbo na frente.
| Nunca | Sempre |
|---|---|
| "Adquira já seu ingresso" | "Garantir meu lugar" |
| "Plataforma completa de gestão de eventos" | "Casa cheia não é sorte" |
| "Experiência incrível" / "imperdível" | dizer o que é: "Uma noite inteira de Rita" |
| "Finalizar transação" | "Pagar com Pix" |
| "Ingresso adquirido com sucesso!" | "Lugar garantido!" |
| "Não há eventos disponíveis" | "Nada em cartaz por aqui ainda. Avisa um produtor ou traz o seu evento." |
Vocabulário da casa: **em cartaz, garantir lugar, casa cheia, canhoto, hoje tem, subir no palco, trazer pro mundo**. Erros orientam ("Esse CPF não bateu. Confere os números?"), nunca se desculpam nem culpam. Botão mantém o nome na jornada inteira: "Garantir meu lugar" → toast "Lugar garantido!".
---
## 16. Fases de execução e critérios de aceite
### Fase A — Fundação (dias 1–2)
- [ ] Archivo via next/font com eixo wdth; Fraunces/Jakarta/JetBrains removidas do bundle (verificar no network tab: só Archivo baixa)
- [ ] Tokens `@theme` completos; nenhuma cor hardcoded fora deles
- [ ] Primitivos: Button (3 variantes), Badge, Marquee, Barras, Duotone, PosterFallback
- [ ] TicketCard e EventStubRow com notch + picote + hover de sombra dura
- [ ] Storybook não é necessário; página `/dev/ui` interna listando os componentes basta
- **Aceite:** screenshot de /dev/ui aprovado antes de seguir.
### Fase B — Telas públicas (dias 3–7)
- [ ] Home completa conforme 8.1 (seções antigas deletadas)
- [ ] Agenda + /agenda/[cidade] com modo noite
- [ ] Página de evento com cartaz + CanhotoCheckout (ainda sem pagamento real)
- [ ] Migração do schema (11.1) com RLS + seed dos eventos atuais
- [ ] Responsivo até 360px; foco visível em tudo; reduced-motion respeitado
- **Aceite:** deploy preview; Lighthouse ≥ 90 em performance e acessibilidade.
### Fase C — O que vende (semana 2)
- [ ] Checkout + Stripe (Pix) + webhook gerando tickets
- [ ] Confirmação com animação do rasgo
- [ ] Rota OG dinâmica testada no debugger do WhatsApp
- [ ] Ticker de escassez realtime com regras de honestidade
- [ ] Entrega provisória do ingresso por e-mail (Resend) com o visual do ingresso
- **Aceite:** compra de teste completa de ponta a ponta em produção (modo test do Stripe).
### Fase D — Invisível mas obrigatório (semana 2–3)
- [ ] Metadata + canonical + sitemap + robots + JSON-LD Event
- [ ] FaixaLGPD + GTM com Consent Mode + GA4 + Meta Pixel + eventos de funil
- [ ] Páginas /privacidade e /politica-de-compras
- [ ] /produtores
- **Aceite:** rich results test do Google passando; pixels disparando só após consentimento.
---
## 17. Prompt de arranque (colar no Claude Code)
```
Você é o arquiteto e design engineer do projeto Elleva Tickets (repo elleva-etiqueteira,
Next.js 15 App Router + TypeScript strict + Tailwind v4 + Supabase + Vercel).
Leia o arquivo elleva-nivel3-spec.md na raiz do repo ANTES de qualquer código.
Ele é a única fonte de verdade de design, copy e arquitetura. Regras:
1. Execute a Fase A completa (seção 16). Não avance para a Fase B sem me mostrar /dev/ui.
2. As "Regras anti-template" da seção 1 são invioláveis. Se um componente seu ficar
   parecido com landing page genérica de IA, refaça a partir dos 4 elementos de assinatura.
3. Nenhuma cor, fonte ou espaçamento fora dos tokens da seção 2. Decisões novas vão
   em docs/decisoes.md.
4. Delete sem dó: Fraunces, Plus Jakarta Sans, JetBrains Mono, a seção de emojis
   flutuantes, o carrossel pastel e a headline "Todo evento que importa,".
5. Commits pequenos e descritivos; deploy preview ao fim de cada fase.
Comece agora pela Fase A: fonts.ts, globals.css com os tokens, e os primitivos.
```
---
*Fim da spec. Qualquer ambiguidade encontrada durante a implementação: resolver a favor do conceito "cartaz de show + ingresso como forma" e registrar em docs/decisoes.md.*