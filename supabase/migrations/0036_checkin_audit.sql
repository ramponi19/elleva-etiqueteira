-- Auditoria de portaria: quem validou cada ingresso (nome + doc do operador).
-- used_at (timestamp) já existe. Preenchido no momento do check-in.
alter table public.tickets add column if not exists checked_in_by text;
alter table public.tickets add column if not exists checked_in_doc text;
