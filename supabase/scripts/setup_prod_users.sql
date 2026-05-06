-- Production user setup for Supabase Dashboard SQL editor
-- Run this AFTER the migrations (0001 + 0002) have been applied.
--
-- The seed.sql inserts into auth.users without `instance_id`, which breaks
-- GoTrue authentication in production. This script fixes that and uses
-- pgcrypto to generate the password hash at insert time.
--
-- Credentials created:
--   coord@catechism.dev     / password123  (coordinator)
--   catechist1@catechism.dev / password123  (catechist)
--   catechist2@catechism.dev / password123  (catechist)

-- ============================================================
-- 1. Clean up any broken auth.users rows from the seed
-- ============================================================
DELETE FROM auth.users WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- ============================================================
-- 2. Re-insert with instance_id + pgcrypto password hash
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
-- 3. Ensure profiles exist (trigger may not fire for direct inserts)
-- ============================================================
INSERT INTO profiles (id, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Maria Coordenadora', 'coordinator'),
  ('00000000-0000-0000-0000-000000000002', 'João Catequista',    'catechist'),
  ('00000000-0000-0000-0000-000000000003', 'Ana Catequista',     'catechist')
ON CONFLICT (id) DO NOTHING;
