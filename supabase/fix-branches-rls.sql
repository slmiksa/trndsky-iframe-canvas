
-- Complete RLS reset and fix for account_branches and account_websites

-- First, completely disable RLS to clean everything
ALTER TABLE account_branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE account_websites DISABLE ROW LEVEL SECURITY;

-- Drop ALL possible existing policies for account_branches
DO $$ 
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'account_branches' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON account_branches', policy_name);
    END LOOP;
END $$;

-- Drop ALL possible existing policies for account_websites
DO $$ 
DECLARE
    policy_name text;
BEGIN
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

-- Create simple policies for account_branches
CREATE POLICY "branches_full_access" ON account_branches
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "branches_public_read" ON account_branches
    FOR SELECT 
    TO anon 
    USING (is_active = true);

-- Create simple policies for account_websites  
CREATE POLICY "websites_full_access" ON account_websites
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "websites_public_read" ON account_websites
    FOR SELECT 
    TO anon 
    USING (is_active = true);
