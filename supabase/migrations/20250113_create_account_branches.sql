
-- Create account_branches table
CREATE TABLE IF NOT EXISTS account_branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    contact_info TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_account_branches_account_id ON account_branches(account_id);
CREATE INDEX IF NOT EXISTS idx_account_branches_is_active ON account_branches(is_active);
CREATE INDEX IF NOT EXISTS idx_account_branches_created_at ON account_branches(created_at);

-- Add RLS policies
ALTER TABLE account_branches ENABLE ROW LEVEL SECURITY;

-- Policy for super admins to manage all branches
CREATE POLICY "Super admins can manage all branches" ON account_branches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Policy for account users to view their own branches
CREATE POLICY "Account users can view their branches" ON account_branches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN accounts a ON ur.account_id = a.id
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'account_user'
            AND a.id = account_id
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_account_branches_updated_at BEFORE UPDATE ON account_branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE account_branches IS 'Branches for each account that can be managed independently';
