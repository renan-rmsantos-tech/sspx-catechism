-- ==========================================================================
-- LIMPEZA DO BANCO — Cola no SQL Editor do Supabase Dashboard.
-- Apaga todos os dados MAS mantém os utilizadores (auth.users + profiles).
-- ==========================================================================

TRUNCATE
  attendance_records,
  attendance_sessions,
  students,
  class_catechists,
  class_dates,
  classes,
  academic_years
CASCADE;
