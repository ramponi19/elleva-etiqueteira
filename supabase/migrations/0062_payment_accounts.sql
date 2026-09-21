-- ============================================================
-- Contas de pagamento (a "instituição em que trabalhamos") no banco.
-- ============================================================
-- Antes, trocar a conta do gateway era mexer em env var na Vercel e
-- redeployar: PAYMENT_PROVIDER + MP_ACCESS_TOKEN + MP_WEBHOOK_SECRET +
-- NEXT_PUBLIC_MP_PUBLIC_KEY. Trocar de instituição (ou só sair do sandbox
-- pra produção) virava tarefa de desenvolvedor. Agora é um menu no /admin.
--
-- SEGREDO VIVO: quem tem o access_token movimenta dinheiro da Elleva. Por isso:
--   1. os segredos entram CRIPTOGRAFADOS (AES-256-GCM, chave em SETTINGS_ENC_KEY
--      — fica na env, nunca no banco: vazar o dump não entrega o token);
--   2. RLS ligada SEM NENHUMA POLICY e grants revogados → nem admin logado
--      alcança a tabela pelo PostgREST. Só `service_role` (server actions).
--   3. toda escrita passa pelo audit_log (ver 0056).
-- `public_key` NÃO é segredo (vai pro navegador tokenizar o cartão) e fica em
-- claro de propósito — precisa ser lida pra montar o SDK do MP no checkout.
create table if not exists public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,                       -- id do adaptador (ex.: "mercadopago")
  label text not null,                          -- apelido pro humano ("MP Elleva — produção")
  environment text not null default 'production'
    check (environment in ('sandbox', 'production')),
  access_token_enc text,                        -- cifrado
  webhook_secret_enc text,                      -- cifrado
  public_key text,                              -- público por natureza (SDK no browser)
  active boolean not null default false,
  -- o que o gateway respondeu no último "Testar conexão" (nickname/e-mail da
  -- conta). É a prova pro Lucas de que o token é da conta que ele pensa que é.
  last_check_at timestamptz,
  last_check_ok boolean,
  last_check_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

-- Uma instituição ativa por vez. O índice parcial é o que garante isso no
-- banco: `active` só pode ser true numa linha (a cópia em código pode errar,
-- a constraint não).
create unique index if not exists payment_accounts_um_ativo
  on public.payment_accounts (active) where active;

create index if not exists payment_accounts_provider_idx
  on public.payment_accounts (provider);

alter table public.payment_accounts enable row level security;
-- Sem policy de propósito: RLS sem policy = ninguém que passe pelo PostgREST
-- lê ou escreve, incluindo o admin logado (que também é `authenticated`).
-- Mesmo padrão de public.rate_limits (0054).

-- Cinto e suspensório: além da RLS, tira o grant herdado do setup, pra uma
-- policy criada por engano no futuro não abrir a tabela sozinha.
revoke all on public.payment_accounts from anon, authenticated;
grant all on public.payment_accounts to service_role;
