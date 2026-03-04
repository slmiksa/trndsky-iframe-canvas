-- Fix slideshow upload RPC mismatch by adding function signature expected by frontend
CREATE OR REPLACE FUNCTION public.create_slideshow_bypass_rls(
  p_account_id uuid,
  p_images text[],
  p_interval_seconds integer DEFAULT 5,
  p_media_type text DEFAULT 'images',
  p_title text DEFAULT 'Untitled',
  p_video_urls text[] DEFAULT '{}'::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  normalized_media_type text;
BEGIN
  normalized_media_type := CASE
    WHEN lower(coalesce(p_media_type, 'images')) IN ('images', 'videos', 'mixed') THEN lower(coalesce(p_media_type, 'images'))
    ELSE 'images'
  END;

  INSERT INTO public.account_slideshows (
    account_id,
    title,
    images,
    video_urls,
    media_type,
    interval_seconds
  )
  VALUES (
    p_account_id,
    COALESCE(NULLIF(trim(p_title), ''), 'Untitled'),
    COALESCE(p_images, '{}'::text[]),
    COALESCE(p_video_urls, '{}'::text[]),
    normalized_media_type,
    COALESCE(p_interval_seconds, 15)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_slideshow_bypass_rls(uuid, text[], integer, text, text, text[]) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';