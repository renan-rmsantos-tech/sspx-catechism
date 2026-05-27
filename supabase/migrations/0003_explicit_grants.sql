-- Migration: 0003_explicit_grants
-- GRANTs explícitos para todas as tabelas + default privileges para tabelas futuras.
-- Necessário após mudança do Supabase (maio 2026): tabelas no schema public
-- não são mais expostas automaticamente à Data API.

-- ============================================================
-- DEFAULT PRIVILEGES (tabelas e sequences criadas futuramente)
-- ============================================================

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role, anon;

-- ============================================================
-- GRANTS NAS TABELAS EXISTENTES
-- ============================================================

-- profiles
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- academic_years
GRANT SELECT ON public.academic_years TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years TO service_role;

-- classes
GRANT SELECT ON public.classes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO service_role;

-- class_catechists
GRANT SELECT ON public.class_catechists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_catechists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_catechists TO service_role;

-- students
GRANT SELECT ON public.students TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO service_role;

-- attendance_sessions
GRANT SELECT ON public.attendance_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO service_role;

-- attendance_records
GRANT SELECT ON public.attendance_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO service_role;

-- class_dates
GRANT SELECT ON public.class_dates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_dates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_dates TO service_role;

-- enrollments
GRANT SELECT ON public.enrollments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO service_role;

-- schema_migrations (somente leitura para roles não-postgres)
GRANT SELECT ON public.schema_migrations TO authenticated, service_role;

-- ============================================================
-- GRANTS NAS SEQUENCES EXISTENTES
-- ============================================================

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role, anon;
