-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'account-videos',
    'account-videos', 
    true,
    104857600, -- 100MB limit
    ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
);

-- Create RLS policies for video storage
CREATE POLICY "Users can upload videos for their accounts" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'account-videos' AND
    (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('account_user', 'super_admin')
        )
        OR 
        auth.uid() IS NOT NULL
    )
);

CREATE POLICY "Users can view videos for their accounts" ON storage.objects
FOR SELECT USING (
    bucket_id = 'account-videos' AND
    (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('account_user', 'super_admin')
        )
        OR 
        auth.uid() IS NOT NULL
    )
);

CREATE POLICY "Users can delete videos for their accounts" ON storage.objects
FOR DELETE USING (
    bucket_id = 'account-videos' AND
    (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('account_user', 'super_admin')
        )
        OR 
        auth.uid() IS NOT NULL
    )
);

CREATE POLICY "Super admin can access all video storage" ON storage.objects
FOR ALL USING (
    bucket_id = 'account-videos' AND
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'super_admin'
    )
);