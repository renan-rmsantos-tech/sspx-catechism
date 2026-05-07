-- Migration: 0002_class_dates
-- Scheduled class dates per academic year. The coordinator defines which
-- Saturdays have classes; attendance is only allowed on these dates.

CREATE TABLE class_dates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  UNIQUE (academic_year_id, date),
  CONSTRAINT class_dates_saturday_only CHECK (EXTRACT(DOW FROM date) = 6)
);

CREATE INDEX idx_class_dates_year ON class_dates (academic_year_id, date);

ALTER TABLE class_dates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (catechists need this for the gate check).
CREATE POLICY class_dates_select ON class_dates
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Only coordinators can insert.
CREATE POLICY class_dates_insert ON class_dates
  FOR INSERT TO authenticated
  WITH CHECK (private.is_coordinator());

-- Only coordinators can delete.
CREATE POLICY class_dates_delete ON class_dates
  FOR DELETE TO authenticated
  USING (private.is_coordinator());
