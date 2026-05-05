-- Migration: 0001_initial_schema
-- Creates all tables, constraints, indexes, RLS policies, and trigger for the catechism attendance system.

-- ============================================================
-- TABLES
-- ============================================================

-- User profiles (linked to Supabase Auth users)
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('coordinator', 'catechist')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Academic years
CREATE TABLE academic_years (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year       INT UNIQUE NOT NULL,
  is_active  BOOLEAN DEFAULT FALSE
);

-- Classes (turmas)
CREATE TABLE classes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  name             TEXT NOT NULL,
  level            TEXT,
  schedule         TEXT,
  is_archived      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Catechists assigned to classes (N:N)
CREATE TABLE class_catechists (
  class_id     UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  catechist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, catechist_id)
);

-- Students
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
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- Attendance sessions (one per class per date, idempotent)
CREATE TABLE attendance_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  date         DATE NOT NULL,
  catechist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  synced_at    TIMESTAMPTZ,
  UNIQUE (class_id, date)
);

-- Individual attendance records
CREATE TABLE attendance_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  present    BOOLEAN NOT NULL,
  UNIQUE (session_id, student_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_students_full_name ON students (full_name);
CREATE INDEX idx_attendance_sessions_class_date ON attendance_sessions (class_id, date);

-- ============================================================
-- TRIGGER: handle_new_user
-- Inserts a row into profiles when a new auth.users record is created.
-- Expects user_metadata.full_name and user_metadata.role.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'catechist')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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

-- Helper: check if the current user is a coordinator
CREATE OR REPLACE FUNCTION is_coordinator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coordinator'
  );
$$;

-- Helper: check if the current user is a catechist for a given class
CREATE OR REPLACE FUNCTION is_class_catechist(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_catechists
    WHERE class_id = p_class_id AND catechist_id = auth.uid()
  );
$$;

-- ---- profiles ----
-- Users read their own profile; coordinator reads all.
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (id = auth.uid() OR is_coordinator());

-- Only trigger/service-role inserts profiles (no direct user insert policy needed).
-- Coordinator can update any profile; user updates own.
CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_coordinator());

-- ---- academic_years ----
-- All authenticated users can view; only coordinator can write.
CREATE POLICY academic_years_select ON academic_years
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY academic_years_insert ON academic_years
  FOR INSERT WITH CHECK (is_coordinator());

CREATE POLICY academic_years_update ON academic_years
  FOR UPDATE USING (is_coordinator());

CREATE POLICY academic_years_delete ON academic_years
  FOR DELETE USING (is_coordinator());

-- ---- classes ----
-- Catechist sees only their classes; coordinator sees all.
CREATE POLICY classes_select ON classes
  FOR SELECT USING (
    is_coordinator()
    OR is_class_catechist(id)
  );

CREATE POLICY classes_insert ON classes
  FOR INSERT WITH CHECK (is_coordinator());

CREATE POLICY classes_update ON classes
  FOR UPDATE USING (is_coordinator());

CREATE POLICY classes_delete ON classes
  FOR DELETE USING (is_coordinator());

-- ---- class_catechists ----
-- Catechist sees own assignments; coordinator sees all.
CREATE POLICY class_catechists_select ON class_catechists
  FOR SELECT USING (
    is_coordinator()
    OR catechist_id = auth.uid()
  );

CREATE POLICY class_catechists_insert ON class_catechists
  FOR INSERT WITH CHECK (is_coordinator());

CREATE POLICY class_catechists_delete ON class_catechists
  FOR DELETE USING (is_coordinator());

-- ---- students ----
-- Catechist sees students in their classes; coordinator sees all.
CREATE POLICY students_select ON students
  FOR SELECT USING (
    is_coordinator()
    OR is_class_catechist(class_id)
  );

CREATE POLICY students_insert ON students
  FOR INSERT WITH CHECK (is_coordinator());

CREATE POLICY students_update ON students
  FOR UPDATE USING (is_coordinator());

CREATE POLICY students_delete ON students
  FOR DELETE USING (is_coordinator());

-- ---- attendance_sessions ----
-- Catechist sees sessions for their classes; coordinator sees all.
CREATE POLICY attendance_sessions_select ON attendance_sessions
  FOR SELECT USING (
    is_coordinator()
    OR is_class_catechist(class_id)
  );

-- Catechist can only insert sessions where they are the catechist and assigned to the class.
CREATE POLICY attendance_sessions_insert ON attendance_sessions
  FOR INSERT WITH CHECK (
    catechist_id = auth.uid()
    AND is_class_catechist(class_id)
  );

CREATE POLICY attendance_sessions_update ON attendance_sessions
  FOR UPDATE USING (
    is_coordinator()
    OR (catechist_id = auth.uid() AND is_class_catechist(class_id))
  );

CREATE POLICY attendance_sessions_delete ON attendance_sessions
  FOR DELETE USING (is_coordinator());

-- ---- attendance_records ----
-- Linked to sessions; access mirrors session access.
CREATE POLICY attendance_records_select ON attendance_records
  FOR SELECT USING (
    is_coordinator()
    OR EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = session_id
        AND is_class_catechist(s.class_id)
    )
  );

CREATE POLICY attendance_records_insert ON attendance_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = session_id
        AND s.catechist_id = auth.uid()
        AND is_class_catechist(s.class_id)
    )
  );

CREATE POLICY attendance_records_update ON attendance_records
  FOR UPDATE USING (
    is_coordinator()
    OR EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = session_id
        AND s.catechist_id = auth.uid()
        AND is_class_catechist(s.class_id)
    )
  );

CREATE POLICY attendance_records_delete ON attendance_records
  FOR DELETE USING (is_coordinator());
