-- +goose Up
-- Consolidated schema for the self-hosted (Supabase-free) deployment.
-- profiles absorbs what used to live in Supabase auth.users (email + password_hash).
-- No RLS / private schema / role grants — authorization lives in the Go app layer.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE profiles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('coordinator','catechist','admin')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE academic_years (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year                 INT UNIQUE NOT NULL,
    is_active            BOOLEAN NOT NULL DEFAULT FALSE,
    class_days           INT[] NOT NULL DEFAULT '{6}',
    enrollment_starts_at DATE,
    enrollment_ends_at   DATE
);

CREATE TABLE classes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    name             TEXT NOT NULL,
    level            TEXT,
    schedule         TEXT,
    is_archived      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
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
    first_communion      BOOLEAN NOT NULL DEFAULT FALSE,
    confirmation         BOOLEAN NOT NULL DEFAULT FALSE,
    previous_catechism   TEXT,
    religious_books      TEXT,
    guardian_father_name TEXT,
    guardian_mother_name TEXT,
    guardian_phone       TEXT,
    guardian_email       TEXT,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_full_name ON students(full_name);

CREATE TABLE attendance_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id     UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    date         DATE NOT NULL,
    catechist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    synced_at    TIMESTAMPTZ,
    UNIQUE (class_id, date)
);
CREATE INDEX idx_attendance_sessions_class_date ON attendance_sessions(class_id, date);

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
CREATE INDEX idx_class_dates_year ON class_dates(academic_year_id, date);

CREATE TABLE enrollments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id   UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    full_name          TEXT NOT NULL,
    birth_date         DATE,
    city               TEXT,
    first_communion    BOOLEAN NOT NULL DEFAULT FALSE,
    confirmation       BOOLEAN NOT NULL DEFAULT FALSE,
    previous_catechism TEXT,
    religious_books    TEXT,
    guardian_father_name TEXT,
    guardian_mother_name TEXT,
    guardian_phone     TEXT,
    guardian_email     TEXT,
    is_renewal         BOOLEAN NOT NULL DEFAULT FALSE,
    previous_name      TEXT,
    rejection_reason   TEXT,
    approved_class_id   UUID REFERENCES classes(id),
    approved_student_id UUID REFERENCES students(id),
    reviewed_by        UUID REFERENCES profiles(id),
    reviewed_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_academic_year ON enrollments(academic_year_id);

-- Keep the weekday validation in the DB (defense in depth; also validated in Go).
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION validate_class_date_day() RETURNS TRIGGER AS $$
DECLARE
    allowed INT[];
BEGIN
    SELECT class_days INTO allowed FROM academic_years WHERE id = NEW.academic_year_id;
    IF allowed IS NULL THEN
        RAISE EXCEPTION 'academic year % not found', NEW.academic_year_id;
    END IF;
    IF NOT (EXTRACT(DOW FROM NEW.date)::INT = ANY(allowed)) THEN
        RAISE EXCEPTION 'date % is not an allowed class weekday', NEW.date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TRIGGER trg_validate_class_date_day
    BEFORE INSERT ON class_dates
    FOR EACH ROW EXECUTE FUNCTION validate_class_date_day();

-- +goose Down
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS class_dates;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS attendance_sessions;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS class_catechists;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS academic_years;
DROP TABLE IF EXISTS profiles;
DROP FUNCTION IF EXISTS validate_class_date_day();
