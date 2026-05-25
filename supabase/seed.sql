-- Seed de desenvolvimento — dados de exemplo para homologação.
--
-- O utilizador admin é provisionado automaticamente pelo servidor (instrumentation.ts)
-- a partir das variáveis ADMIN_EMAIL e ADMIN_PASSWORD.
--
-- Este ficheiro contém apenas dados de exemplo (turmas, alunos, chamada).
-- Execute no SQL Editor (nuvem) ou via `supabase db reset` (local).
--
-- NOTA: este seed assume que já existem utilizadores criados pela app.
-- Os IDs de catequistas referenciados abaixo são placeholders para desenvolvimento.

-- ############################################################################
-- Dados de exemplo (ano letivo, turmas, alunos, chamada)
-- ############################################################################

INSERT INTO academic_years (id, year, is_active, class_days) VALUES
  ('10000000-0000-0000-0000-000000000001', 2026, TRUE, '{6}')
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

