-- Seed inicial de eventos (timezone America/Sao_Paulo)
insert into public.events (slug, title, description, category, icon, venue, city, starts_at) values
  ('rita', 'Ana Cañas canta Rita Lee',
   'Uma celebração intimista do rock brasileiro, revisitando os clássicos de Rita Lee em arranjos exclusivos.',
   'SHOW', 'solar:microphone-large-bold-duotone', 'Teatro Municipal', 'Mogi Mirim', '2026-07-12 19:30:00-03'),
  ('ligajoe', 'Liga Joe — Clube Mogiano',
   'A noite mais aguardada do interior. Line-up completo, estrutura premium e open de pista.',
   'FESTA', 'solar:disco-ball-bold-duotone', 'Clube Mogiano', 'Mogi Mirim', '2026-08-08 20:00:00-03'),
  ('copa', 'Copa Tijuca: Brasil x Marrocos',
   'Futebol de base de alto nível em um confronto internacional imperdível para toda a família.',
   'ESPORTE', 'solar:ball-bold-duotone', 'Arena', 'Mogi Guaçu', '2026-08-23 12:00:00-03'),
  ('standup', 'Stand-up Comedy Night',
   'Uma noite de humor afiado com os melhores comediantes do circuito nacional.',
   'TEATRO', 'solar:masks-bold-duotone', 'Teatro', 'Americana', '2026-09-28 20:00:00-03'),
  ('rodolfinho', 'Nosso Quintal — MC Rodolfinho',
   'O fenômeno do funk em um show especial e energético no palco do Nosso Quintal.',
   'SHOW', 'solar:music-notes-bold-duotone', 'Nosso Quintal', 'Itapira', '2026-09-14 22:30:00-03'),
  ('summit', 'Summit Tech Interior 2026',
   'O maior encontro de tecnologia e inovação do interior, com palestras, painéis e networking.',
   'CORPORATIVO', 'solar:presentation-graph-bold-duotone', 'Centro de Convenções', 'Americana', '2026-10-05 09:00:00-03');

-- Tiers por evento: Pista = preço base, VIP = +70, Camarote = +190
insert into public.ticket_tiers (event_id, name, description, price, sort_order)
select e.id, t.name, t.description, base.price_from + t.delta, t.sort_order
from public.events e
cross join (values
  ('rita', 90), ('ligajoe', 60), ('copa', 40), ('standup', 50), ('rodolfinho', 70), ('summit', 120)
) as base(slug, price_from)
cross join (values
  ('Pista', 'Acesso à área geral', 0, 0),
  ('VIP', 'Área elevada + open bar', 70, 1),
  ('Camarote', 'Vista privilegiada + lounge', 190, 2)
) as t(name, description, delta, sort_order)
where e.slug = base.slug;
