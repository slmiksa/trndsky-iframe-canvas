


-- Add RLS bypass for super admin users
CREATE OR REPLACE POLICY "Super admins can do everything with notifications"
ON public.notifications
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') IS NOT NULL
)
WITH CHECK (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') IS NOT NULL
);

-- First, disable RLS temporarily to clear all policies
ALTER TABLE account_branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE account_websites DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for account_branches
DROP POLICY IF EXISTS "Users can view branches of their accounts" ON account_branches;
DROP POLICY IF EXISTS "Users can insert branches for their accounts" ON account_branches;
DROP POLICY IF EXISTS "Users can update branches of their accounts" ON account_branches;
DROP POLICY IF EXISTS "Users can delete branches of their accounts" ON account_branches;
DROP POLICY IF EXISTS "Allow authenticated users to view branches" ON account_branches;
DROP POLICY IF EXISTS "Allow authenticated users to insert branches" ON account_branches;
DROP POLICY IF EXISTS "Allow authenticated users to update branches" ON account_branches;
DROP POLICY IF EXISTS "Allow authenticated users to delete branches" ON account_branches;
DROP POLICY IF EXISTS "authenticated_users_full_access_branches" ON account_branches;
DROP POLICY IF EXISTS "authenticated_users_can_manage_branches" ON account_branches;
DROP POLICY IF EXISTS "Public can view active branches" ON account_branches;

-- Drop ALL existing policies for account_websites
DROP POLICY IF EXISTS "Users can view websites of their accounts" ON account_websites;
DROP POLICY IF EXISTS "Users can insert websites for their accounts" ON account_websites;
DROP POLICY IF EXISTS "Users can update websites of their accounts" ON account_websites;
DROP POLICY IF EXISTS "Users can delete websites of their accounts" ON account_websites;
DROP POLICY IF EXISTS "Allow authenticated users to view websites" ON account_websites;
DROP POLICY IF EXISTS "Allow authenticated users to insert websites" ON account_websites;
DROP POLICY IF EXISTS "Allow authenticated users to update websites" ON account_websites;
DROP POLICY IF EXISTS "Allow authenticated users to delete websites" ON account_websites;
DROP POLICY IF EXISTS "authenticated_users_full_access_websites" ON account_websites;
DROP POLICY IF EXISTS "authenticated_users_can_manage_websites" ON account_websites;
DROP POLICY IF EXISTS "Public can view active websites" ON account_websites;

-- Re-enable RLS
ALTER TABLE account_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_websites ENABLE ROW LEVEL SECURITY;

-- Create simple and working RLS policies for branches
CREATE POLICY "Allow all authenticated users to manage branches" ON account_branches
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow public to view active branches" ON account_branches
  FOR SELECT USING (is_active = true);

-- Create simple and working RLS policies for websites
CREATE POLICY "Allow all authenticated users to manage websites" ON account_websites
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow public to view active websites" ON account_websites
  FOR SELECT USING (is_active = true);


