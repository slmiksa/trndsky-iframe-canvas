
-- Complete fix for RLS policies on account_branches and account_websites

-- First, completely disable RLS temporarily to clean everything
ALTER TABLE account_branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE account_websites DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    policy_name text;
BEGIN
    -- Drop all policies for account_branches
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'account_branches' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON account_branches', policy_name);
    END LOOP;
    
    -- Drop all policies for account_websites
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'account_websites' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON account_websites', policy_name);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE account_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_websites ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for account_branches
CREATE POLICY "Enable all operations for authenticated users on account_branches"
    ON account_branches
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable read access for anonymous users on active account_branches"
    ON account_branches
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Create comprehensive policies for account_websites  
CREATE POLICY "Enable all operations for authenticated users on account_websites"
    ON account_websites
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable read access for anonymous users on active account_websites"
    ON account_websites
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Grant necessary permissions
GRANT ALL ON account_branches TO authenticated;
GRANT SELECT ON account_branches TO anon;
GRANT ALL ON account_websites TO authenticated;
GRANT SELECT ON account_websites TO anon;

-- Ensure sequences are accessible
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify the policies are working by checking if they exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('account_branches', 'account_websites')
ORDER BY tablename, policyname;
