-- Create account_videos table for video management
CREATE TABLE IF NOT EXISTS public.account_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS account_videos_account_id_idx ON public.account_videos(account_id);
CREATE INDEX IF NOT EXISTS account_videos_is_active_idx ON public.account_videos(is_active);
CREATE INDEX IF NOT EXISTS account_videos_created_at_idx ON public.account_videos(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.account_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for account_videos
CREATE POLICY "Users can view their own videos" ON public.account_videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.account_id = account_videos.account_id
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.accounts a
            WHERE a.id = account_videos.account_id
            AND a.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert videos for their accounts" ON public.account_videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.account_id = account_videos.account_id
            AND ur.role IN ('account_user', 'super_admin')
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.accounts a
            WHERE a.id = account_videos.account_id
            AND a.id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own videos" ON public.account_videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.account_id = account_videos.account_id
            AND ur.role IN ('account_user', 'super_admin')
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.accounts a
            WHERE a.id = account_videos.account_id
            AND a.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own videos" ON public.account_videos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.account_id = account_videos.account_id
            AND ur.role IN ('account_user', 'super_admin')
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.accounts a
            WHERE a.id = account_videos.account_id
            AND a.id = auth.uid()
        )
    );

-- Super admin can access all videos
CREATE POLICY "Super admin can access all videos" ON public.account_videos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_account_videos_updated_at
    BEFORE UPDATE ON public.account_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to ensure only one active video per account
CREATE OR REPLACE FUNCTION ensure_single_active_video()
RETURNS TRIGGER AS $$
BEGIN
    -- If the video is being activated
    IF NEW.is_active = true AND (OLD.is_active IS NULL OR OLD.is_active = false) THEN
        -- Deactivate all other videos for this account
        UPDATE public.account_videos 
        SET is_active = false 
        WHERE account_id = NEW.account_id 
        AND id != NEW.id 
        AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_video
    BEFORE UPDATE ON public.account_videos
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_video();

-- Grant necessary permissions
GRANT ALL ON public.account_videos TO authenticated;
GRANT ALL ON public.account_videos TO service_role;