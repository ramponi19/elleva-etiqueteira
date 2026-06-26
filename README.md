# Elleva Tickets

Plataforma de **venda de ingressos** — shows, festas, esporte, teatro, cursos e eventos corporativos no interior de SP e sul de MG.

**Stack:** Next.js 16 (App Router + Turbopack) · TypeScript · Branor Design System (Fraunces + Plus Jakarta Sans + JetBrains Mono) · Supabase (auth) · Vercel

## Desenvolvimento

```bash
npm install
cp .env.local.example .env.local   # opcional (auth Supabase)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Fluxo principal

```
Home (/)  →  Agenda (/agenda)  →  Evento (/evento/[id])  →  Checkout (/checkout)
```

- **Home** — hero cinematográfico do evento em destaque, grade de eventos, categorias, CTA produtor
- **Agenda** — lista filtrável de todos os eventos
- **Evento** — banner, detalhes e seletor de ingressos (tiers Pista/VIP/Camarote) com stepper
- **Checkout** — carrinho, dados, pagamento (Pix/Cartão) e confirmação

Carrinho global em `lib/cart.tsx` (persistido em `localStorage`). Dados mock em `lib/events.ts` — substituir por API/DB real.

## Estrutura

```
app/
  (marketing)/      Storefront: layout (Nav + Footer + CartProvider), home, agenda, evento/[id], checkout
  (auth)/           login, signup, callback (Supabase)
components/
  marketing/        Nav, Hero, EventCard, AgendaRow, TicketSelector, ProducerCTA, Footer
  shared/           Icon (Iconify: solar duotone + lucide)
lib/                cart.tsx, events.ts, format.ts, supabase/
app/globals.css     Branor Design System (tokens navy/gold/bone + classes)
```

## Design System (Branor)

Navy `#162332` + gold `#C6A86A` + bone `#F6F3EB`. Tipografia editorial (Fraunces serif, Plus Jakarta Sans, JetBrains Mono mono). Tokens completos em `app/globals.css` (`:root`), com tema dark pronto via `[data-theme="dark"]`.

## Deploy

Deploy contínuo via Vercel — push na branch `main` publica em produção. Região `gru1` (São Paulo).

## Próximos passos

- Schema de dados real (events, ticket_tiers, orders, order_items) no Supabase
- Pagamento real (Pix/Cartão)
- Área do produtor (dashboard de eventos e vendas)
