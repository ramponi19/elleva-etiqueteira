-- Dados de compra + preferências no perfil do usuário (tela "Minha Conta").
-- Aditivo (nullable/default) — não quebra dados nem código existente.
-- Aplicada no remoto em 2026-07-07 (MCP).

alter table public.profiles
  add column if not exists cpf text,
  add column if not exists birth_date date,
  add column if not exists phone text,
  add column if not exists cep text,
  add column if not exists address text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists notify_purchases boolean not null default false,
  add column if not exists notify_news boolean not null default false;
