-- Migration: 0002_enrollments
-- Tabela de inscrições públicas + colunas de período em academic_years + guardian_email em students.

-- ============================================================
-- ALTER EXISTING TABLES
-- ============================================================

ALTER TABLE academic_years ADD COLUMN enrollment_starts_at DATE;
ALTER TABLE academic_years ADD COLUMN enrollment_ends_at DATE;

ALTER TABLE students ADD COLUMN guardian_email TEXT;

-- ============================================================
-- NEW TABLE: enrollments
-- ============================================================

CREATE TABLE enrollments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id     UUID NOT NULL REFERENCES academic_years(id),
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Dados do catequizando
  full_name            TEXT NOT NULL,
  birth_date           DATE,
  city                 TEXT,
  first_communion      BOOLEAN DEFAULT FALSE,
  confirmation         BOOLEAN DEFAULT FALSE,
  previous_catechism   TEXT,
  religious_books      TEXT,

  -- Dados do responsável
  guardian_father_name TEXT,
  guardian_mother_name TEXT,
  guardian_phone       TEXT,
  guardian_email       TEXT,

  -- Renovação
  is_renewal           BOOLEAN DEFAULT FALSE,
  previous_name        TEXT,

  -- Revisão pelo admin
  rejection_reason     TEXT,
  approved_class_id    UUID REFERENCES classes(id),
  approved_student_id  UUID REFERENCES students(id),
  reviewed_by          UUID REFERENCES profiles(id),
  reviewed_at          TIMESTAMPTZ,

  created_at           TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_academic_year ON enrollments(academic_year_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY enrollments_select ON enrollments
  FOR SELECT TO authenticated
  USING (private.is_coordinator());

CREATE POLICY enrollments_update ON enrollments
  FOR UPDATE TO authenticated
  USING (private.is_coordinator());
