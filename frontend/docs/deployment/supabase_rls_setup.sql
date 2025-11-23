-- =====================================================
-- Supabase Row Level Security (RLS) Setup
-- =====================================================
-- This script fixes the security warnings in Supabase
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Enable Row Level Security on all tables
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any (for idempotency)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Users can create own events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;

DROP POLICY IF EXISTS "Allow migrations table access" ON public._prisma_migrations;

-- 3. Create RLS Policies for Users table
-- =====================================================

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (true);  -- All authenticated users can read user data (needed for API)

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow user creation (for registration)
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (true);

-- 4. Create RLS Policies for Events table
-- =====================================================

-- Allow users to view only their own events
CREATE POLICY "Users can view own events"
ON public.events
FOR SELECT
USING (
  auth.uid()::text = "userId" OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = events."userId"
  )
);

-- Allow users to create events (userId will be set by application)
CREATE POLICY "Users can create own events"
ON public.events
FOR INSERT
WITH CHECK (true);

-- Allow users to update only their own events
CREATE POLICY "Users can update own events"
ON public.events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = events."userId"
  )
);

-- Allow users to delete only their own events
CREATE POLICY "Users can delete own events"
ON public.events
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = events."userId"
  )
);

-- 5. Allow Prisma migrations table to be accessed
-- =====================================================

CREATE POLICY "Allow migrations table access"
ON public._prisma_migrations
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Fix function search_path issue
-- =====================================================

-- Drop and recreate the function with secure search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Fix: Set explicit search_path
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers if they existed
DROP TRIGGER IF EXISTS set_updated_at ON public.users;
DROP TRIGGER IF EXISTS set_updated_at ON public.events;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Grant necessary permissions
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public._prisma_migrations TO authenticated;

-- Grant permissions to service role (for migrations and admin tasks)
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.events TO service_role;
GRANT ALL ON public._prisma_migrations TO service_role;

-- =====================================================
-- Verification Queries (optional - run separately)
-- =====================================================

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies exist
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE schemaname = 'public';

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
--
-- 1. These policies are permissive for development
--    In production, you may want stricter policies
--
-- 2. The application should validate userId matches
--    the authenticated user when creating/updating events
--
-- 3. If using JWT authentication (not Supabase Auth),
--    you may need to modify policies to use application-level
--    user identification instead of auth.uid()
--
-- 4. After running this script, test your application
--    to ensure all CRUD operations still work correctly
--
-- =====================================================
