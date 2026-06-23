-- =============================================================================
-- Migration: Add authentication support to profiles table
-- =============================================================================
--
-- Run this AFTER the initial schema.sql has been applied.
-- This adds role, organization, and approval tracking to the profiles table,
-- and creates a trigger to auto-populate profiles when users sign up.
--
-- WARNING: This is for prototype/demo purposes. HIPAA/security review is
-- required before handling real patient data in production.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Add new columns to profiles
-- ---------------------------------------------------------------------------

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'patient'
    CHECK (role IN ('patient', 'caregiver', 'clinic', 'vendor', 'admin'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS organization_name text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'denied'));


-- ---------------------------------------------------------------------------
-- Auto-create profile when a new user signs up via Supabase Auth
-- ---------------------------------------------------------------------------
-- The frontend passes full_name, role, and organization_name as user metadata
-- during signUp(). This trigger reads that metadata and inserts a profile row.
--
-- Patient and caregiver roles are auto-approved; clinic, vendor, and admin
-- roles require manual approval by an admin.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role, organization_name, approval_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'organization_name',
    CASE
      WHEN COALESCE(new.raw_user_meta_data->>'role', 'patient') IN ('patient', 'caregiver')
        THEN 'approved'
      ELSE 'pending'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ---------------------------------------------------------------------------
-- RLS: Allow users to read their own approval_status (already covered by
-- the "Users can view their own profile" policy in schema.sql, which grants
-- SELECT on all columns where id = auth.uid()).
-- ---------------------------------------------------------------------------

-- No additional RLS policies needed — the existing per-table policies cover
-- the new columns.
