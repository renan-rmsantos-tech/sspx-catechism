-- Migration: 0004_must_change_password
-- Adds flag to force password change on first login for catechists created by admin.

ALTER TABLE profiles ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;
