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
