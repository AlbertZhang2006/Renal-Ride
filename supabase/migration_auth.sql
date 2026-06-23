-- =============================================================================
-- Migration: Add authentication support to profiles table
-- =============================================================================
--
-- Run this AFTER the initial schema.sql has been applied.
-- This adds role, organization, and approval tracking to the profiles table.
-- Profile rows are created automatically by the frontend on first login.
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
-- Allow users to insert their own profile on first login
-- ---------------------------------------------------------------------------
-- The frontend stores signup metadata (full_name, role, organization_name)
-- in auth.users.user_metadata via signUp(). On first login, if no profile
-- row exists, the frontend reads this metadata and inserts the profile.
-- ---------------------------------------------------------------------------

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());


-- ---------------------------------------------------------------------------
-- Clean up any old trigger-based approach (safe to run even if it doesn't exist)
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
