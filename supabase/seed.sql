-- Seed data for local development
-- NOTE: Run via Supabase CLI: supabase db push && supabase db seed
-- For production, use supabase/scripts/setup_prod_users.sql instead.

-- ============================================================
-- USERS (auth.users + profiles)
-- Uses pgcrypto to hash passwords — works locally and in production.
-- Password for all dev accounts: password123
-- ============================================================

INSERT INTO auth.users (
  instance_id,
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  aud, role,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'coord@catechism.dev',
    crypt('password123', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Maria Coordenadora","role":"coordinator"}',
    now(), now(), 'authenticated', 'authenticated',
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'catechist1@catechism.dev',
    crypt('password123', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"João Catequista","role":"catechist"}',
    now(), now(), 'authenticated', 'authenticated',
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000003',
    'catechist2@catechism.dev',
    crypt('password123', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ana Catequista","role":"catechist"}',
    now(), now(), 'authenticated', 'authenticated',
    '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- Profiles (the trigger handles this on real user creation; insert directly for seed)
INSERT INTO profiles (id, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Maria Coordenadora', 'coordinator'),
  ('00000000-0000-0000-0000-000000000002', 'João Catequista',    'catechist'),
  ('00000000-0000-0000-0000-000000000003', 'Ana Catequista',     'catechist')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ACADEMIC YEAR
-- ============================================================

INSERT INTO academic_years (id, year, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 2026, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CLASSES
-- ============================================================

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

-- ============================================================
-- CLASS–CATECHIST ASSIGNMENTS
-- ============================================================

INSERT INTO class_catechists (class_id, catechist_id) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STUDENTS (5 total: 3 in Turma A, 2 in Turma B)
-- ============================================================

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

-- ============================================================
-- SAMPLE ATTENDANCE SESSION + RECORDS (for Turma A, 2026-04-05)
-- ============================================================

INSERT INTO attendance_sessions (id, class_id, date, catechist_id, synced_at) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '2026-04-05',
    '00000000-0000-0000-0000-000000000002',
    now()
  )
ON CONFLICT (class_id, date) DO NOTHING;

INSERT INTO attendance_records (id, session_id, student_id, present) VALUES
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', TRUE),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', TRUE),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', FALSE)
ON CONFLICT (session_id, student_id) DO NOTHING;
