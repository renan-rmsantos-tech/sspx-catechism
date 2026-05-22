-- Migration: 0003_soft_delete
-- Adds is_active column to profiles and students for soft-delete support.

ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE students ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
