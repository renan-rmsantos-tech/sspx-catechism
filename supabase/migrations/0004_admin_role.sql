-- Migration: 0004_admin_role
-- Expands the profiles role check constraint to include 'admin'.

ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('coordinator', 'catechist', 'admin'));
