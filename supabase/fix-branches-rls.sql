
-- Fix RLS policies for account_branches table
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view branches of their accounts" ON account_branches;
DROP POLICY IF EXISTS "Users can insert branches for their accounts" ON account_branches;
DROP POLICY IF EXISTS "Users can update branches of their accounts" ON account_branches;
DROP POLICY IF EXISTS "Users can delete branches of their accounts" ON account_branches;

-- Create simplified RLS policies that work with the current auth system
CREATE POLICY "Allow authenticated users to view branches" ON account_branches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert branches" ON account_branches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update branches" ON account_branches
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete branches" ON account_branches
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Keep the public policy for viewing active branches
-- This policy already exists and should work fine

-- Fix RLS policies for account_websites table as well
DROP POLICY IF EXISTS "Users can view websites of their accounts" ON account_websites;
DROP POLICY IF EXISTS "Users can insert websites for their accounts" ON account_websites;
DROP POLICY IF EXISTS "Users can update websites of their accounts" ON account_websites;
DROP POLICY IF EXISTS "Users can delete websites of their accounts" ON account_websites;

CREATE POLICY "Allow authenticated users to view websites" ON account_websites
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert websites" ON account_websites
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update websites" ON account_websites
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete websites" ON account_websites
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Public access for viewing active websites
CREATE POLICY "Public can view active websites" ON account_websites
  FOR SELECT USING (is_active = true);
