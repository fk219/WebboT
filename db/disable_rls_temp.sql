-- TEMPORARY: Disable RLS for development
-- Run this in Supabase SQL Editor to fix the infinite recursion issue

-- Disable RLS on organizations
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on bots
ALTER TABLE public.bots DISABLE ROW LEVEL SECURITY;

-- Disable RLS on organization_members
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that are causing recursion
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can delete" ON public.organizations;

DROP POLICY IF EXISTS "Users can view bots in their orgs" ON public.bots;
DROP POLICY IF EXISTS "Org members can create bots" ON public.bots;
DROP POLICY IF EXISTS "Org members can update bots" ON public.bots;
DROP POLICY IF EXISTS "Org owners can delete bots" ON public.bots;

DROP POLICY IF EXISTS "Users can view org members" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;

-- You can now create/read/update/delete without RLS blocking you
-- We'll add proper RLS policies later after testing

SELECT 'RLS disabled successfully!' as status;
