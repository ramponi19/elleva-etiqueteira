# Elleva — Gestão de Etiquetas Industriais

Plataforma SaaS para gestão completa de etiquetas industriais: modelos, impressoras e jobs de impressão.

**Stack:** Next.js 16 (App Router + Turbopack) · TypeScript strict · Tailwind v4 · Supabase (Auth + DB + RLS) · Drizzle · Stripe · Resend · Vercel

## Desenvolvimento

```bash
npm install
cp .env.local.example .env.local   # preencha as variáveis
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run typecheck` | Checagem de tipos (tsc --noEmit) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Gera migrations Drizzle |
| `npm run db:studio` | Drizzle Studio |

## Estrutura

```
app/
  (marketing)/      Landing page (Navbar, Hero, Features, Pricing, Testimonials, Footer)
  (auth)/           login, signup, callback
  (dashboard)/      dashboard, etiquetas, impressoras, jobs, configuracoes (membros, billing)
  api/webhooks/     Stripe webhook
components/          ui, marketing, dashboard, shared
lib/                supabase/, actions/, email/, stripe.ts, resend.ts
supabase/migrations/ Schema SQL + RLS
types/              Tipos gerados do Supabase
```

## Banco de dados (Supabase)

Tabelas: `organizations`, `profiles`, `label_templates`, `printers`, `print_jobs`, `invitations`.
Todas com RLS por `org_id` (multi-tenant). Migrations em `supabase/migrations/`.

## Deploy

Deploy contínuo via Vercel — push na branch `main` publica em produção.
Região: `gru1` (São Paulo). Variáveis de ambiente: ver `.env.local.example`.
