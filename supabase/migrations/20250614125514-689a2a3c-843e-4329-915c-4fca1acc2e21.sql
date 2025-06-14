
-- إنشاء دالة لإضافة السلايدات مع تجاوز RLS للنظام المخصص
CREATE OR REPLACE FUNCTION create_slideshow_bypass_rls(
  p_account_id UUID,
  p_title TEXT,
  p_images TEXT[],
  p_interval_seconds INTEGER DEFAULT 5
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  slideshow_id UUID;
BEGIN
  -- إنشاء السلايدات مع تجاوز RLS
  INSERT INTO public.account_slideshows (
    account_id,
    title,
    images,
    interval_seconds,
    is_active
  ) VALUES (
    p_account_id,
    p_title,
    p_images,
    p_interval_seconds,
    false
  ) RETURNING id INTO slideshow_id;
  
  RETURN slideshow_id;
END;
$$;
