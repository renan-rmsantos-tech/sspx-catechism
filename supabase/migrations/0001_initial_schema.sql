-- Migration: 0001_initial_schema
-- Schema completo do sistema de catequese: tabelas, indexes, triggers, RLS e hardening.

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('coordinator', 'catechist', 'admin')),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE academic_years (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year       INT UNIQUE NOT NULL,
  is_active  BOOLEAN DEFAULT FALSE,
  class_days INT[] NOT NULL DEFAULT '{6}'
);

CREATE TABLE classes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  name             TEXT NOT NULL,
  level            TEXT,
  schedule         TEXT,
  is_archived      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE class_catechists (
  class_id     UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  catechist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, catechist_id)
);

CREATE TABLE students (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id             UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  full_name            TEXT NOT NULL,
  birth_date           DATE,
  city                 TEXT,
  first_communion      BOOLEAN DEFAULT FALSE,
  confirmation         BOOLEAN DEFAULT FALSE,
  previous_catechism   TEXT,
  religious_books      TEXT,
  guardian_father_name TEXT,
  guardian_mother_name TEXT,
  guardian_phone       TEXT,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attendance_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  date         DATE NOT NULL,
  catechist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  synced_at    TIMESTAMPTZ,
  UNIQUE (class_id, date)
);

CREATE TABLE attendance_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  present    BOOLEAN NOT NULL,
  UNIQUE (session_id, student_id)
);

CREATE TABLE class_dates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  UNIQUE (academic_year_id, date)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_students_full_name ON students (full_name);
CREATE INDEX idx_attendance_sessions_class_date ON attendance_sessions (class_id, date);
CREATE INDEX idx_class_dates_year ON class_dates (academic_year_id, date);

-- ============================================================
-- TRIGGER: handle_new_user
-- Inserts a profile when a new auth.users record is created.
-- Role is always catechist; privileged roles are set via admin panel.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'catechist'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: validate_class_date_day
-- Ensures class_dates fall on days configured in academic_years.class_days.
-- ============================================================

CREATE OR REPLACE FUNCTION validate_class_date_day()
RETURNS TRIGGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  allowed_days INT[];
  date_dow INT;
BEGIN
  SELECT ay.class_days INTO allowed_days
  FROM public.academic_years ay
  WHERE ay.id = NEW.academic_year_id;

  IF allowed_days IS NULL THEN
    RAISE EXCEPTION 'Ano letivo não encontrado';
  END IF;

  date_dow := EXTRACT(DOW FROM NEW.date)::INT;

  IF NOT (date_dow = ANY(allowed_days)) THEN
    RAISE EXCEPTION 'Data % cai no dia da semana %, que não está configurado para este ano letivo (dias permitidos: %)',
      NEW.date, date_dow, allowed_days;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_class_date_day
  BEFORE INSERT ON class_dates
  FOR EACH ROW EXECUTE FUNCTION validate_class_date_day();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_catechists ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_dates ENABLE ROW LEVEL SECURITY;

-- RLS helpers in schema "private" (not exposed by PostgREST)
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_coordinator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('coordinator', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_class_catechist(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_catechists
    WHERE class_id = p_class_id
      AND catechist_id = (SELECT auth.uid())
  );
$$;

GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_coordinator() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_class_catechist(UUID) TO authenticated, service_role;

-- ---- profiles ----
CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.is_coordinator());

CREATE POLICY profiles_update ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.is_coordinator());

-- ---- academic_years ----
CREATE POLICY academic_years_select ON academic_years
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY academic_years_insert ON academic_years
  FOR INSERT TO authenticated
  WITH CHECK (private.is_coordinator());

CREATE POLICY academic_years_update ON academic_years
  FOR UPDATE TO authenticated
  USING (private.is_coordinator());

CREATE POLICY academic_years_delete ON academic_years
  FOR DELETE TO authenticated
  USING (private.is_coordinator());

-- ---- classes ----
CREATE POLICY classes_select ON classes
  FOR SELECT TO authenticated
  USING (
    private.is_coordinator()
    OR private.is_class_catechist(id)
  );

CREATE POLICY classes_insert ON classes
  FOR INSERT TO authenticated
  WITH CHECK (private.is_coordinator());

CREATE POLICY classes_update ON classes
  FOR UPDATE TO authenticated
  USING (private.is_coordinator());

CREATE POLICY classes_delete ON classes
  FOR DELETE TO authenticated
  USING (private.is_coordinator());

-- ---- class_catechists ----
CREATE POLICY class_catechists_select ON class_catechists
  FOR SELECT TO authenticated
  USING (
    private.is_coordinator()
    OR catechist_id = auth.uid()
  );

CREATE POLICY class_catechists_insert ON class_catechists
  FOR INSERT TO authenticated
  WITH CHECK (private.is_coordinator());

CREATE POLICY class_catechists_delete ON class_catechists
  FOR DELETE TO authenticated
  USING (private.is_coordinator());

-- ---- students ----
CREATE POLICY students_select ON students
  FOR SELECT TO authenticated
  USING (
    private.is_coordinator()
    OR private.is_class_catechist(class_id)
  );

CREATE POLICY students_insert ON students
  FOR INSERT TO authenticated
  WITH CHECK (private.is_coordinator());

CREATE POLICY students_update ON students
  FOR UPDATE TO authenticated
  USING (private.is_coordinator());

CREATE POLICY students_delete ON students
  FOR DELETE TO authenticated
  USING (private.is_coordinator());

-- ---- attendance_sessions ----
CREATE POLICY attendance_sessions_select ON attendance_sessions
  FOR SELECT TO authenticated
  USING (
    private.is_coordinator()
    OR private.is_class_catechist(class_id)
  );

CREATE POLICY attendance_sessions_insert ON attendance_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    catechist_id = auth.uid()
    AND private.is_class_catechist(class_id)
  );

CREATE POLICY attendance_sessions_update ON attendance_sessions
  FOR UPDATE TO authenticated
  USING (
    private.is_coordinator()
    OR (catechist_id = auth.uid() AND private.is_class_catechist(class_id))
  );

CREATE POLICY attendance_sessions_delete ON attendance_sessions
  FOR DELETE TO authenticated
  USING (private.is_coordinator());

-- ---- attendance_records ----
CREATE POLICY attendance_records_select ON attendance_records
  FOR SELECT TO authenticated
  USING (
    private.is_coordinator()
    OR EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = session_id
        AND private.is_class_catechist(s.class_id)
    )
  );

CREATE POLICY attendance_records_insert ON attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = session_id
        AND s.catechist_id = auth.uid()
        AND private.is_class_catechist(s.class_id)
    )
  );

CREATE POLICY attendance_records_update ON attendance_records
  FOR UPDATE TO authenticated
  USING (
    private.is_coordinator()
    OR EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = session_id
        AND s.catechist_id = auth.uid()
        AND private.is_class_catechist(s.class_id)
    )
  );

CREATE POLICY attendance_records_delete ON attendance_records
  FOR DELETE TO authenticated
  USING (private.is_coordinator());

-- ---- class_dates ----
CREATE POLICY class_dates_select ON class_dates
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY class_dates_insert ON class_dates
  FOR INSERT TO authenticated
  WITH CHECK (private.is_coordinator());

CREATE POLICY class_dates_delete ON class_dates
  FOR DELETE TO authenticated
  USING (private.is_coordinator());

-- ============================================================
-- RPC hardening
-- ============================================================

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION validate_class_date_day() FROM PUBLIC, anon, authenticated;

DO $body$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'rls_auto_enable'
      AND p.pronargs = 0
  ) THEN
    EXECUTE $revoke$
      REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated
    $revoke$;
  END IF;
END;
$body$;
