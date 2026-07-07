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
