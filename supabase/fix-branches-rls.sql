
-- Fix RLS policies for account_branches table
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view branches of their accounts" ON account_branches;
DROP POLICY IF EXISTS "Users can insert branches for their accounts" ON account_branches;
DROP POLICY IF EXISTS "Users can update branches of their accounts" ON account_branches;
DROP POLICY IF EXISTS "Users can delete branches of their accounts" ON account_branches;
DROP POLICY IF EXISTS "Allow authenticated users to view branches" ON account_branches;
DROP POLICY IF EXISTS "Allow authenticated users to insert branches" ON account_branches;
DROP POLICY IF EXISTS "Allow authenticated users to update branches" ON account_branches;
DROP POLICY IF EXISTS "Allow authenticated users to delete branches" ON account_branches;

-- Create new simplified RLS policies
CREATE POLICY "authenticated_users_full_access_branches" ON account_branches
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Keep the public policy for viewing active branches
CREATE POLICY "Public can view active branches" ON account_branches
  FOR SELECT USING (is_active = true);

-- Fix RLS policies for account_websites table as well
DROP POLICY IF EXISTS "Users can view websites of their accounts" ON account_websites;
DROP POLICY IF EXISTS "Users can insert websites for their accounts" ON account_websites;
DROP POLICY IF EXISTS "Users can update websites of their accounts" ON account_websites;
DROP POLICY IF EXISTS "Users can delete websites of their accounts" ON account_websites;
DROP POLICY IF EXISTS "Allow authenticated users to view websites" ON account_websites;
DROP POLICY IF EXISTS "Allow authenticated users to insert websites" ON account_websites;
DROP POLICY IF EXISTS "Allow authenticated users to update websites" ON account_websites;
DROP POLICY IF EXISTS "Allow authenticated users to delete websites" ON account_websites;

-- Create new simplified RLS policy for websites
CREATE POLICY "authenticated_users_full_access_websites" ON account_websites
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Public access for viewing active websites
CREATE POLICY "Public can view active websites" ON account_websites
  FOR SELECT USING (is_active = true);
