-- ============================================================
-- M7: trilha de auditoria das ações administrativas.
-- ============================================================
-- Antes, nenhuma ação sensível do admin deixava rastro: trocar papel de um
-- usuário, forçar um repasse, estornar lançamento, cancelar pedido/evento,
-- ajustar taxa. Com dois admins isso vira discussão sem prova; num
-- questionamento de repasse, vira exposição. Só o servidor (service_role)
-- escreve; ninguém apaga (append-only por falta de policy de update/delete).
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,                 -- quem fez (auth.uid do admin)
  actor_email text,              -- e-mail no momento (o profile pode mudar depois)
  action text not null,          -- ex.: "set_role", "payout_paid", "cancel_event"
  target text,                   -- id/afetado (ex.: user_id, order_id, event_id)
  detail jsonb,                  -- contexto (valores, motivo)
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_action_idx on public.audit_log (action);

alter table public.audit_log enable row level security;
-- Admin LÊ (pela tela); só service_role escreve. Sem policy de insert/update/
-- delete para authenticated: a trilha é append-only e inviolável pelo usuário.
create policy "Admins read audit log" on public.audit_log for select using (my_role() = 'admin');
