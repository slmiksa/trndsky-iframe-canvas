-- Create account_videos table
CREATE TABLE account_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    video_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_account_videos_account_id ON account_videos(account_id);
CREATE INDEX idx_account_videos_is_active ON account_videos(is_active);

-- Add RLS (Row Level Security)
ALTER TABLE account_videos ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own account videos
CREATE POLICY "Users can manage their own account videos" ON account_videos
    FOR ALL USING (
        account_id IN (
            SELECT account_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- Allow public read access for active videos (for TV display)
CREATE POLICY "Public can view active videos" ON account_videos
    FOR SELECT USING (is_active = true);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_account_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_account_videos_updated_at
    BEFORE UPDATE ON account_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_account_videos_updated_at();

-- Add trigger to ensure only one active video per account
CREATE OR REPLACE FUNCTION ensure_single_active_video()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this video to active, deactivate all others for this account
    IF NEW.is_active = true THEN
        UPDATE account_videos 
        SET is_active = false 
        WHERE account_id = NEW.account_id 
        AND id != NEW.id 
        AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_active_video
    BEFORE INSERT OR UPDATE ON account_videos
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION ensure_single_active_video();

-- Add function to get active video for account
CREATE OR REPLACE FUNCTION get_active_video_for_account(p_account_id UUID)
RETURNS SETOF account_videos
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM account_videos 
    WHERE account_id = p_account_id 
    AND is_active = true 
    LIMIT 1;
$$;