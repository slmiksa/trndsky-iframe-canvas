
-- Create account_branches table with proper structure
CREATE TABLE IF NOT EXISTS account_branches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  branch_name text NOT NULL,
  branch_path text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique branch path per account
  UNIQUE(account_id, branch_path)
);

-- Enable RLS
ALTER TABLE account_branches ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
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

-- Create simple and effective RLS policies
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

-- Grant necessary permissions
GRANT ALL ON account_branches TO authenticated;
GRANT SELECT ON account_branches TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_account_branches_account_id ON account_branches(account_id);
CREATE INDEX IF NOT EXISTS idx_account_branches_path ON account_branches(account_id, branch_path);
CREATE INDEX IF NOT EXISTS idx_account_branches_active ON account_branches(is_active);

-- Add branch_id to existing tables if not exists
DO $$ 
BEGIN
    -- Add branch_id to account_slideshows if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'account_slideshows' AND column_name = 'branch_id') THEN
        ALTER TABLE account_slideshows ADD COLUMN branch_id uuid REFERENCES account_branches(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_slideshows_branch_id ON account_slideshows(branch_id);
    END IF;
    
    -- Add branch_id to account_videos if table exists and column doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_videos') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'account_videos' AND column_name = 'branch_id') THEN
            ALTER TABLE account_videos ADD COLUMN branch_id uuid REFERENCES account_branches(id) ON DELETE CASCADE;
            CREATE INDEX IF NOT EXISTS idx_videos_branch_id ON account_videos(branch_id);
        END IF;
    END IF;
    
    -- Add branch_id to notifications if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'branch_id') THEN
        ALTER TABLE notifications ADD COLUMN branch_id uuid REFERENCES account_branches(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_notifications_branch_id ON notifications(branch_id);
    END IF;
    
    -- Add branch_id to news_ticker if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_ticker' AND column_name = 'branch_id') THEN
        ALTER TABLE news_ticker ADD COLUMN branch_id uuid REFERENCES account_branches(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_news_ticker_branch_id ON news_ticker(branch_id);
    END IF;
    
    -- Add branch_id to break_timers if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'break_timers' AND column_name = 'branch_id') THEN
        ALTER TABLE break_timers ADD COLUMN branch_id uuid REFERENCES account_branches(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_break_timers_branch_id ON break_timers(branch_id);
    END IF;
    
    -- Add branch_id to account_websites if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'account_websites' AND column_name = 'branch_id') THEN
        ALTER TABLE account_websites ADD COLUMN branch_id uuid REFERENCES account_branches(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_websites_branch_id ON account_websites(branch_id);
    END IF;
END $$;

-- Verify table creation
SELECT 
    schemaname, 
    tablename, 
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'account_branches';

-- Verify RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'account_branches'
ORDER BY policyname;
