-- Test users for Supabase **cloud** (SQL Editor), after migrations are applied.
--
-- When to run:
--   - Novo projeto Supabase: após `supabase db push` (ou colar migrações manualmente
--     em ordem: 0001_initial_schema.sql → 0002_…).
--   - Ambiente de desenvolvimento na nuvem ou preview: use à vontade com a senha abaixo.
--
-- Produção com dados reais: **não** execute isto com estas credenciais fracas; crie
-- coordenadores pela UI (Sign up) ou ajuste e-mails/senhas antes de rodar.
--
-- Requer extensão `pgcrypto` (em Supabase: Database → Extensions → pgcrypto, se faltar).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Credenciais criadas (somente para dev / homologação):
--   coord@catechism.dev       / password123  (coordinator)
--   catechist1@catechism.dev  / password123  (catechist)
--   catechist2@catechism.dev  / password123  (catechist)

-- ============================================================
-- 1. Clean up any duplicate rows from a previous run or broken seed
-- ============================================================
DELETE FROM auth.users WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- ============================================================
-- 2. Insert with instance_id + pgcrypto password hash (GoTrue)
-- ============================================================
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
  );

-- ============================================================
-- 3. Profiles (direct auth.users inserts may not fire trigger)
-- ============================================================
INSERT INTO profiles (id, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Maria Coordenadora', 'coordinator'),
  ('00000000-0000-0000-0000-000000000002', 'João Catequista',    'catechist'),
  ('00000000-0000-0000-0000-000000000003', 'Ana Catequista',     'catechist')
ON CONFLICT (id) DO NOTHING;
