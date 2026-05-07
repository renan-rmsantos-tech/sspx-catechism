-- Seed de desenvolvimento / homologação (senhas fracas — nunca em produção real).
--
-- Uso:
--   • `supabase db reset` (stack local): aplica migrações e este ficheiro completo (`config.toml`).
--   • SQL Editor (nuvem): após migrações, execute o ficheiro inteiro, ou só a **SECÇÃO A** se quiser
--     apenas contas de teste (sem turmas/alunos/chamadas). A secção B depende dos utilizadores da A.
--
-- Senha das três contas de teste: password123

-- ############################################################################
-- SECÇÃO A — Utilizadores Auth + perfis (mínimo para login na app na nuvem)
-- ############################################################################

-- Opcional: remover contas de teste para um rerun limpo no SQL Editor (cloud).
DELETE FROM auth.users WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'coord@catechism.dev',
    crypt('password123', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Maria Coordenadora","role":"coordinator"}',
    now(), now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'catechist1@catechism.dev',
    crypt('password123', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"João Catequista","role":"catechist"}',
    now(), now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'catechist2@catechism.dev',
    crypt('password123', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ana Catequista","role":"catechist"}',
    now(), now(),
    '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- O trigger cria sempre catechist; aqui fixamos o coordenador e nomes.
INSERT INTO profiles (id, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Maria Coordenadora', 'coordinator'),
  ('00000000-0000-0000-0000-000000000002', 'João Catequista',    'catechist'),
  ('00000000-0000-0000-0000-000000000003', 'Ana Catequista',     'catechist')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- ############################################################################
-- SECÇÃO B — Dados de exemplo (ano letivo, turmas, alunos, chamada)
-- Omitir na nuvem se só precisar da Secção A.
-- ############################################################################

INSERT INTO academic_years (id, year, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 2026, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO classes (id, academic_year_id, name, level, schedule) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Turma A — 1ª Eucaristia',
    '1ª Eucaristia',
    'Sábados 09:00–10:30'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Turma B — Crisma',
    'Crisma',
    'Sábados 10:30–12:00'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO class_catechists (class_id, catechist_id) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO students (id, class_id, full_name, birth_date, city, first_communion, confirmation) VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Pedro Alves',
    '2015-03-12',
    'São Paulo',
    FALSE, FALSE
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'Clara Santos',
    '2015-07-22',
    'São Paulo',
    FALSE, FALSE
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'Lucas Ferreira',
    '2014-11-05',
    'São Paulo',
    FALSE, FALSE
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000002',
    'Beatriz Costa',
    '2009-04-18',
    'Campinas',
    TRUE, FALSE
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000002',
    'Rafael Lima',
    '2008-09-30',
    'Campinas',
    TRUE, FALSE
  )
ON CONFLICT (id) DO NOTHING;

-- Scheduled Saturdays for the 2026 academic year
INSERT INTO class_dates (academic_year_id, date) VALUES
  ('10000000-0000-0000-0000-000000000001', '2026-02-07'),
  ('10000000-0000-0000-0000-000000000001', '2026-02-14'),
  ('10000000-0000-0000-0000-000000000001', '2026-02-21'),
  ('10000000-0000-0000-0000-000000000001', '2026-02-28'),
  ('10000000-0000-0000-0000-000000000001', '2026-03-07'),
  ('10000000-0000-0000-0000-000000000001', '2026-03-14'),
  ('10000000-0000-0000-0000-000000000001', '2026-03-21'),
  ('10000000-0000-0000-0000-000000000001', '2026-03-28'),
  ('10000000-0000-0000-0000-000000000001', '2026-04-04'),
  ('10000000-0000-0000-0000-000000000001', '2026-04-11'),
  ('10000000-0000-0000-0000-000000000001', '2026-04-25'),
  ('10000000-0000-0000-0000-000000000001', '2026-05-02'),
  ('10000000-0000-0000-0000-000000000001', '2026-05-09'),
  ('10000000-0000-0000-0000-000000000001', '2026-05-16'),
  ('10000000-0000-0000-0000-000000000001', '2026-05-23'),
  ('10000000-0000-0000-0000-000000000001', '2026-05-30')
ON CONFLICT (academic_year_id, date) DO NOTHING;

INSERT INTO attendance_sessions (id, class_id, date, catechist_id, synced_at) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '2026-04-04',
    '00000000-0000-0000-0000-000000000002',
    now()
  )
ON CONFLICT (class_id, date) DO NOTHING;

INSERT INTO attendance_records (id, session_id, student_id, present) VALUES
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', TRUE),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', TRUE),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', FALSE)
ON CONFLICT (session_id, student_id) DO NOTHING;
