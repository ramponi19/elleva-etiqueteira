-- ============================================================
-- Colunas de controle deixam de ser escrevíveis pelo dono da linha.
-- (Auditoria 2026-08-24 — achados C4 e A5.)
-- ============================================================
-- A RLS diz QUAIS LINHAS a pessoa edita; ela não diz QUAIS COLUNAS. Como o
-- grant era de TABELA INTEIRA, "editar o próprio perfil" e "gerenciar os
-- próprios eventos" incluíam campos que são decisão da Elleva.
--
-- Provado antes desta migration, com sessão de produtor real simulada e as
-- permissões reais (transação revertida):
--   update profiles set advance_enabled=true, advance_fee_pct=0  → PASSOU
--   update events set is_featured=true, max_installments=12      → PASSOU
--
-- ARMADILHA (custou uma tentativa): `revoke update (coluna)` NÃO tem efeito
-- quando o papel tem UPDATE no nível da tabela — o grant de tabela cobre toda
-- coluna, inclusive as criadas depois. A primeira versão desta migration só
-- revogava colunas e não bloqueava nada; o ensaio em transação revertida foi
-- quem pegou. O caminho certo é o daqui: revogar a TABELA e reconceder a
-- lista explícita de colunas legítimas.
--
-- CONSEQUÊNCIA PARA MIGRATIONS FUTURAS: coluna nova em profiles/events/
-- ticket_tiers/seats nasce SEM permissão de escrita pro usuário. Se o
-- formulário passar a gravá-la, some-a ao grant correspondente aqui embaixo.
--
-- Duas escritas legítimas passavam por colunas agora bloqueadas e foram
-- movidas pro cliente de serviço no mesmo commit:
--   - setFeatured (admin também é `authenticated`)  → lib/actions/events.ts
--   - becomeProducerAndGo (promoção a produtor)     → lib/actions/producer.ts
--
-- `service_role` não é afetado: mantém o grant de tabela.
-- ============================================================

-- ------------------------------------------------------------
-- anon nunca escreve nada: a RLS já barra, o grant era só herança do setup
-- ------------------------------------------------------------
revoke insert, update on public.profiles      from anon;
revoke insert, update on public.events        from anon;
revoke insert, update on public.ticket_tiers  from anon;
revoke insert, update on public.seats         from anon;

-- ------------------------------------------------------------
-- C4 · profiles: o usuário edita o cadastro dele, não o contrato dele
--   bloqueados: role, advance_enabled, advance_fee_pct, id, created_at
-- ------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant update (
  full_name, avatar_url, cpf, phone, birth_date,
  cep, address, address_number, address_complement, neighborhood, city, state,
  notify_news, notify_purchases,
  payout_pix_type, payout_pix_key, payout_holder, payout_doc
) on public.profiles to authenticated;

-- ------------------------------------------------------------
-- A5 · events: o produtor edita o evento, não a vitrine nem o contrato
--   bloqueados: is_featured, featured_order, max_installments, service_fee_pct,
--               serial, checkin_token, reminder_sent_at, id, created_at, updated_at
--   (slug e producer_id: só no INSERT, que é a criação do evento)
-- ------------------------------------------------------------
revoke insert, update on public.events from authenticated;

grant update (
  title, description, category, subcategory,
  venue, city, state, cep, address, address_number, address_complement,
  neighborhood, show_on_maps, starts_at, ends_at,
  icon, cover_url, theme, producer_name, producer_bio,
  visibility, absorb_fee, ticket_nomenclature,
  tracking_meta_pixel, tracking_ga, has_seating,
  certificate_enabled, certificate_title, certificate_body,
  certificate_hours, certificate_signer, status
) on public.events to authenticated;

grant insert (
  slug, producer_id,
  title, description, category, subcategory,
  venue, city, state, cep, address, address_number, address_complement,
  neighborhood, show_on_maps, starts_at, ends_at,
  icon, cover_url, theme, producer_name, producer_bio,
  visibility, absorb_fee, ticket_nomenclature,
  tracking_meta_pixel, tracking_ga, has_seating,
  certificate_enabled, certificate_title, certificate_body,
  certificate_hours, certificate_signer, status
) on public.events to authenticated;

-- ------------------------------------------------------------
-- A5 · ticket_tiers: preço e capacidade são do produtor; `sold` é do caixa
--   (só reserve_tier_stock, que roda como service_role, altera vendido)
-- ------------------------------------------------------------
revoke insert, update on public.ticket_tiers from authenticated;
grant insert (event_id, name, description, price, capacity, is_free, is_addon, sort_order)
  on public.ticket_tiers to authenticated;
grant update (name, description, price, capacity, is_free, is_addon, sort_order)
  on public.ticket_tiers to authenticated;

-- ------------------------------------------------------------
-- A5 · seats: o produtor desenha o mapa (insere/apaga); o ESTADO do assento
--   é do fluxo de pagamento. updateEvent apaga e recria — nunca dá UPDATE.
-- ------------------------------------------------------------
revoke insert, update on public.seats from authenticated;
grant insert (event_id, tier_id, sector, row_label, seat_num, label, pos_row, pos_col, status)
  on public.seats to authenticated;
