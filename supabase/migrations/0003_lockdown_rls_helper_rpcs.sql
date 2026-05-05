-- Hosted Supabase runs migrations without database superuser; leak-proof functions cannot be created here.
-- Move RLS helpers to schema `private`: PostgREST only exposes schemas in API settings
-- (default is `public`), so `/rest/v1/rpc/` no longer lists these SECURITY DEFINER helpers.
--
-- Idempotent for projects already on 0001 with private.* only: policies are recreated then
-- `DROP FUNCTION IF EXISTS public.*` is a no-op.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_coordinator()
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

CREATE OR REPLACE FUNCTION private.is_class_catechist(p_class_id UUID)
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

GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_coordinator() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_class_catechist(UUID) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;
DROP POLICY IF EXISTS academic_years_select ON academic_years;
DROP POLICY IF EXISTS academic_years_insert ON academic_years;
DROP POLICY IF EXISTS academic_years_update ON academic_years;
DROP POLICY IF EXISTS academic_years_delete ON academic_years;
DROP POLICY IF EXISTS classes_select ON classes;
DROP POLICY IF EXISTS classes_insert ON classes;
DROP POLICY IF EXISTS classes_update ON classes;
DROP POLICY IF EXISTS classes_delete ON classes;
DROP POLICY IF EXISTS class_catechists_select ON class_catechists;
DROP POLICY IF EXISTS class_catechists_insert ON class_catechists;
DROP POLICY IF EXISTS class_catechists_delete ON class_catechists;
DROP POLICY IF EXISTS students_select ON students;
DROP POLICY IF EXISTS students_insert ON students;
DROP POLICY IF EXISTS students_update ON students;
DROP POLICY IF EXISTS students_delete ON students;
DROP POLICY IF EXISTS attendance_sessions_select ON attendance_sessions;
DROP POLICY IF EXISTS attendance_sessions_insert ON attendance_sessions;
DROP POLICY IF EXISTS attendance_sessions_update ON attendance_sessions;
DROP POLICY IF EXISTS attendance_sessions_delete ON attendance_sessions;
DROP POLICY IF EXISTS attendance_records_select ON attendance_records;
DROP POLICY IF EXISTS attendance_records_insert ON attendance_records;
DROP POLICY IF EXISTS attendance_records_update ON attendance_records;
DROP POLICY IF EXISTS attendance_records_delete ON attendance_records;

CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (id = auth.uid() OR private.is_coordinator());

CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = auth.uid() OR private.is_coordinator());

CREATE POLICY academic_years_select ON academic_years
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY academic_years_insert ON academic_years
  FOR INSERT WITH CHECK (private.is_coordinator());

CREATE POLICY academic_years_update ON academic_years
  FOR UPDATE USING (private.is_coordinator());

CREATE POLICY academic_years_delete ON academic_years
  FOR DELETE USING (private.is_coordinator());

CREATE POLICY classes_select ON classes
  FOR SELECT USING (
    private.is_coordinator()
    OR private.is_class_catechist(id)
  );

CREATE POLICY classes_insert ON classes
  FOR INSERT WITH CHECK (private.is_coordinator());

CREATE POLICY classes_update ON classes
  FOR UPDATE USING (private.is_coordinator());

CREATE POLICY classes_delete ON classes
  FOR DELETE USING (private.is_coordinator());

CREATE POLICY class_catechists_select ON class_catechists
  FOR SELECT USING (
    private.is_coordinator()
    OR catechist_id = auth.uid()
  );

CREATE POLICY class_catechists_insert ON class_catechists
  FOR INSERT WITH CHECK (private.is_coordinator());

CREATE POLICY class_catechists_delete ON class_catechists
  FOR DELETE USING (private.is_coordinator());

CREATE POLICY students_select ON students
  FOR SELECT USING (
    private.is_coordinator()
    OR private.is_class_catechist(class_id)
  );

CREATE POLICY students_insert ON students
  FOR INSERT WITH CHECK (private.is_coordinator());

CREATE POLICY students_update ON students
  FOR UPDATE USING (private.is_coordinator());

CREATE POLICY students_delete ON students
  FOR DELETE USING (private.is_coordinator());

CREATE POLICY attendance_sessions_select ON attendance_sessions
  FOR SELECT USING (
    private.is_coordinator()
    OR private.is_class_catechist(class_id)
  );

CREATE POLICY attendance_sessions_insert ON attendance_sessions
  FOR INSERT WITH CHECK (
    catechist_id = auth.uid()
    AND private.is_class_catechist(class_id)
  );

CREATE POLICY attendance_sessions_update ON attendance_sessions
  FOR UPDATE USING (
    private.is_coordinator()
    OR (catechist_id = auth.uid() AND private.is_class_catechist(class_id))
  );

CREATE POLICY attendance_sessions_delete ON attendance_sessions
  FOR DELETE USING (private.is_coordinator());

CREATE POLICY attendance_records_select ON attendance_records
  FOR SELECT USING (
    private.is_coordinator()
    OR EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = session_id
        AND private.is_class_catechist(s.class_id)
    )
  );

CREATE POLICY attendance_records_insert ON attendance_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = session_id
        AND s.catechist_id = auth.uid()
        AND private.is_class_catechist(s.class_id)
    )
  );

CREATE POLICY attendance_records_update ON attendance_records
  FOR UPDATE USING (
    private.is_coordinator()
    OR EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = session_id
        AND s.catechist_id = auth.uid()
        AND private.is_class_catechist(s.class_id)
    )
  );

CREATE POLICY attendance_records_delete ON attendance_records
  FOR DELETE USING (private.is_coordinator());

DROP FUNCTION IF EXISTS public.is_coordinator();
DROP FUNCTION IF EXISTS public.is_class_catechist(uuid);
