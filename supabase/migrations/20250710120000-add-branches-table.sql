-- Create branches table
CREATE TABLE account_branches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  branch_name text NOT NULL,
  branch_path text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique branch path per account
  UNIQUE(account_id, branch_path)
);

-- Enable RLS
ALTER TABLE account_branches ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view branches of their accounts" ON account_branches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = account_branches.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert branches for their accounts" ON account_branches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = account_branches.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update branches of their accounts" ON account_branches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = account_branches.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete branches of their accounts" ON account_branches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = account_branches.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

-- Public access for viewing branches
CREATE POLICY "Public can view active branches" ON account_branches
  FOR SELECT USING (is_active = true);

-- Add branch_id to existing tables
ALTER TABLE account_slideshows ADD COLUMN branch_id uuid REFERENCES account_branches(id) ON DELETE CASCADE;
ALTER TABLE account_videos ADD COLUMN branch_id uuid REFERENCES account_branches(id) ON DELETE CASCADE;
ALTER TABLE account_news_tickers ADD COLUMN branch_id uuid REFERENCES account_branches(id) ON DELETE CASCADE;
ALTER TABLE account_break_timers ADD COLUMN branch_id uuid REFERENCES account_branches(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_account_branches_account_id ON account_branches(account_id);
CREATE INDEX idx_account_branches_path ON account_branches(account_id, branch_path);
CREATE INDEX idx_slideshows_branch_id ON account_slideshows(branch_id);
CREATE INDEX idx_videos_branch_id ON account_videos(branch_id);
CREATE INDEX idx_news_tickers_branch_id ON account_news_tickers(branch_id);
CREATE INDEX idx_break_timers_branch_id ON account_break_timers(branch_id);

-- Create functions for branches management
CREATE OR REPLACE FUNCTION get_account_branches(account_id_param uuid)
RETURNS TABLE (
  id uuid,
  account_id uuid,
  branch_name text,
  branch_path text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ab.id, ab.account_id, ab.branch_name, ab.branch_path, ab.is_active, ab.created_at, ab.updated_at
  FROM account_branches ab
  WHERE ab.account_id = account_id_param
  ORDER BY ab.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION create_account_branch(
  account_id_param uuid,
  branch_name_param text,
  branch_path_param text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  branch_id uuid;
BEGIN
  INSERT INTO account_branches (account_id, branch_name, branch_path, is_active)
  VALUES (account_id_param, branch_name_param, branch_path_param, true)
  RETURNING id INTO branch_id;
  
  RETURN branch_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_account_branch(
  branch_id_param uuid,
  branch_name_param text,
  branch_path_param text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE account_branches 
  SET branch_name = branch_name_param, 
      branch_path = branch_path_param,
      updated_at = now()
  WHERE id = branch_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION delete_account_branch(branch_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM account_branches WHERE id = branch_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION toggle_branch_status(
  branch_id_param uuid,
  new_status boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE account_branches 
  SET is_active = new_status,
      updated_at = now()
  WHERE id = branch_id_param;
END;
$$;