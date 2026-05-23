-- Migration: 0005_class_days
-- Makes class days configurable per academic year instead of hardcoding Saturday.
-- Adds class_days column (integer array of JS getDay() values: 0=Sun..6=Sat),
-- drops the Saturday-only CHECK constraint, and adds a trigger-based validation.

-- 1. Add class_days column (default to Saturday for backwards compat)
ALTER TABLE academic_years
  ADD COLUMN class_days INT[] NOT NULL DEFAULT '{6}';

-- 2. Drop the hardcoded Saturday-only constraint
ALTER TABLE class_dates
  DROP CONSTRAINT class_dates_saturday_only;

-- 3. Validation trigger: ensures inserted class_dates fall on configured days
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

-- Revoke direct RPC access
REVOKE ALL ON FUNCTION validate_class_date_day() FROM PUBLIC, anon, authenticated;
