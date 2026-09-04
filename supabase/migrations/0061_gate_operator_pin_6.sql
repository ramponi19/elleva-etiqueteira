-- M-5 (auditoria 2026-09-03): o PIN da portaria eram os 4 primeiros dígitos do
-- CPF do operador — previsível (quem conhece o CPF sabe o PIN) e com só 10 mil
-- combinações. Passa a ser aleatório de 6 dígitos, gerado no servidor
-- (lib/actions/operators.ts). Aqui: regenera os PINs existentes e trava o formato.

update public.gate_operators
   set pin = lpad(((('x' || substr(gen_random_uuid()::text, 1, 8))::bit(32)::bigint) % 1000000)::text, 6, '0')
 where pin !~ '^[0-9]{6}$';

alter table public.gate_operators drop constraint if exists gate_operators_pin_format;
alter table public.gate_operators
  add constraint gate_operators_pin_format check (pin ~ '^[0-9]{6}$');
