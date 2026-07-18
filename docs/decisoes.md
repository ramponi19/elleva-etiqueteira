# Decisões de implementação — remodelação Nível 3 "Cartaz de Show"

Registro exigido pela spec (§0 e §17): toda decisão fora do documento entra aqui.

## Fase A (2026-07-07)

- **Stack real difere da spec:** o projeto está em **Next 16.2.9 + React 19** (a spec cita Next 15) e o gateway de pagamento existente é **Mercado Pago** (a spec cita Stripe). Fase A não toca pagamento; a decisão Stripe × Mercado Pago fica para a Fase C — a infra de webhook/emissão de tickets da spec (§11.1) vale para qualquer gateway.
- **Categoria `CURSO`:** existe no banco atual, mas não no mapa categoria→cor da spec (§2). Tratada como o grupo corporativo/feira → arte `papel-2` com borda tinta. O check da migração (§11.1) precisará incluir `curso` ou migrar os eventos dessa categoria.
- **CSS legado mantido temporariamente:** as classes do design antigo (navy/gold/bone, `.marketing-mono` P&B, `.btn-*`, `.ev-card` etc.) foram movidas para um bloco `LEGADO` no fim de `app/globals.css`, com as fontes remapeadas para Archivo. Elas mantêm as rotas antigas (admin, produtor, conta, checkout e o marketing atual) renderizando até cada tela ser refeita na Fase B/C. **Proibido usar em código novo.** Também sobrevivem 4 aliases `--color-navy/gold/bone` no `@theme` (9 usos em 6 telas antigas) — morrem com as telas.
- **Fontes:** Fraunces, Plus Jakarta Sans e JetBrains Mono removidas do `layout.tsx`; só Archivo (com eixo `wdth`) baixa via next/font. `app/fonts.ts` criado conforme §3.
- **Modo noite:** implementado desde já como variáveis semânticas `--cor-fundo/--cor-texto/--cor-borda/--cor-hover` remapeadas por `[data-theme="noite"]` (§14). EventStubRow e CityPills já as consomem — a agenda da Fase B só precisa do atributo no wrapper.
- **Variação de largura (wdth):** aplicada via `font-stretch` (120%/118%/115%), que mapeia para o eixo `wdth` da variable font — sem `font-variation-settings` manual.
- **`Duotone` usa `<img>` direto** (não `next/image`): a receita depende de `filter` + `mix-blend-mode` no elemento; otimização de imagem entra depois, se necessário, sem mudar a API do componente.
- **Foto demo do `/dev/ui`** vem do picsum.photos (não há foto de evento no repo). Página marcada `robots: noindex`.

## Fase B (2026-07-07)

- **Schema §11.1 já existia funcionalmente:** o pivot etiquetas→tickets aconteceu nas migrations 0005–0016 (`events`, `ticket_tiers`≅`ticket_types`, `orders`, `tickets`, cupons, featured). Não recriamos o schema da spec; só adicionamos a migration `0018_events_serial.sql` (nº de série do cartaz). **Pendente:** aplicar a 0018 no banco remoto (o MCP do Supabase estava desconectado); até lá o serial é derivado do uuid (`serialFallback` em lib/events.ts) e a coluna fica fora do `select`.
- **Sem tabela `venues`:** venue/cidade continuam inline em `events` (venue, city). O "ver no mapa" da página de evento abre busca no Google Maps com "venue · cidade" — não há endereço/coordenadas no schema atual, então o mapa embed da spec (8.3) fica pra quando houver endereço.
- **CanhotoCheckout absorve a etapa de seleção:** a página do evento agora tem lotes + stepper + CTA direto (spec 8.3). A rota antiga `/evento/[id]/ingressos` continua existindo para links antigos, mas a jornada principal é evento → (login) → /checkout.
- **Nav "Produtores" e CTA da home** apontam para `/#produtores` e para a action `becomeProducerAndGo` (fluxo existente). A landing `/produtores` é item da Fase D.
- **Ticker de escassez** da página de evento fica para a Fase C (exige realtime + dados reais, §11).
- **Cidades das rotas estáticas** (`lib/cidades.ts`): Mogi Guaçu, Mogi Mirim, Itapira, Americana, Sul de MG; a cidade do evento é derivada do sufixo de `venueCity` ("Venue · Cidade").
- **Deletados:** carousel, event-grid, event-card, producer-cta, agenda-content, agenda-row, nav/footer antigos, lib/event-theme.ts, motion/magnetic.tsx.

## Aceite da Fase B (2026-07-07)

- **Migration 0018 aplicada no banco remoto** (conector Supabase reconectou): eventos com serial 1–6; `lib/events.ts` voltou a ler a coluna real (fallback por uuid permanece só como rede de segurança).
- **Lighthouse (mobile, deploy preview, mediana de runs locais):** home **90** (runs 83/90/90), evento **94**, agenda **96**; acessibilidade **100** nas três. Ambiente local tem variância de ±5 no TBT — validar no PageSpeed Insights quando promover pra produção.
- **Causas raiz de performance encontradas e corrigidas:** (1) `template.tsx` do marketing embrulhava toda página em framer-motion `initial opacity:0` — o HTML chegava invisível e o LCP só pintava pós-hidratação (~4s em TODAS as rotas); removido, transição de rota não está na spec §9. (2) capas servidas cruas do Unsplash → Duotone via next/image (AVIF/srcset). (3) GSAP/Lenis e supabase-js saíram do bundle crítico via import dinâmico. (4) hero sem data-reveal (LCP não pode ser escondido e reanimado). (5) só a primeira capa da home com priority (3 preloads competiam na banda).
- **Lição de CSS (Tailwind v4):** regra fora de `@layer` vence QUALQUER utilitário. O `a { color:inherit }` da base engolia `text-*` em links (pill ativa ilegível) e `.duotone { position:relative }` engolia `absolute`. Base agora em `@layer base` e componentes CSS em `@layer components`. O bloco LEGADO continua fora de layer de propósito (as telas antigas dependem dessa precedência).
- **Contraste §4 aplicado de verdade:** texto pequeno sobre sol = tinta (`fgPequeno` em lib/arte.ts); destaque pequeno no modo noite = cartaz (sol sobre tinta é 4,1:1, reprova AA em 11px).

## Fase D (2026-07-17)

- **URL canônica centralizada em `lib/site.ts`** (`SITE_URL` = `NEXT_PUBLIC_APP_URL` ou `https://elleva.app`), consumida por metadata, sitemap, robots e JSON-LD. **Antes de promover produção, garantir `NEXT_PUBLIC_APP_URL` na Vercel** — sem ela o sitemap/JSON-LD saem com o fallback.
- **`app/robots.ts`:** só o marketing indexa; `/admin`, `/produtor`, `/conta`, `/checkout`, `/criar-evento`, `/meus-eventos`, `/validar`, `/api/`, `/dev/` e rotas de auth ficam em `Disallow`.
- **`app/sitemap.ts`:** home, agenda, cidades (`lib/cidades.ts`), eventos publicados (via `getEvents`, com o mesmo fallback mock do site), `/produtores`, ajuda, terms e privacy. Se o Supabase cair, o sitemap lista os mocks — coerente com o que o site renderiza nesse cenário.
- **JSON-LD:** `schema.org/Event` na página de evento (startDate ISO com fuso via novo campo `EventItem.startsAtISO`, `AggregateOffer` com lowPrice/BRL, availability por `soldOut`, OG image como imagem) e `Organization` + `WebSite` com `SearchAction` (`/agenda?q=`) na home. Componente `components/seo/json-ld.tsx` escapa `<` no stringify (guia json-ld do Next).
- **Landing `/produtores`:** publica → vende → controla + recursos que já existem (Pix/Mercado Pago, link de portaria sem login, painel de vendas, divulgação regional); CTA reusa `becomeProducerAndGo`. Sem números de taxa/preço na página — não há tabela de preços definida. Footer e bloco da home apontam pra ela (antes: `/#produtores`). Botão do hero em variante `tinta` porque o `primario` da viewport do topo é o "Entrar" da nav (§7).
- **LGPD/cookies:** banner de consentimento (`components/elleva/cookie-consent.tsx`, montado no root layout) com `useSyncExternalStore` sobre localStorage (`elleva:cookies`) — o lint do React 19 proíbe setState síncrono em effect. O **GTM só carrega após "Aceitar"** e só se `NEXT_PUBLIC_GTM_ID` existir; sem ID não há cookie de medição e o banner nem aparece (Vercel Analytics é cookieless e os cookies de sessão são essenciais — cobertos na seção 5 nova da Política de Privacidade). Sem `<noscript>` do GTM: com carga condicionada a consentimento (JS), o iframe noscript não faz sentido.
- **GTM sem Consent Mode do Google:** o gate é binário (não carrega nada sem aceite), então não configuramos `gtag consent default/update`; se um dia o GTM precisar disparar tags antes do aceite, migrar pra Consent Mode.
