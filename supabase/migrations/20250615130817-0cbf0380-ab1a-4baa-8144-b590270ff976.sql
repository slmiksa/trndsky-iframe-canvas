
-- إضافة سياسة للسماح بقراءة السلايدات النشطة للعرض العام
CREATE POLICY "Allow public read access to active slideshows" 
ON public.account_slideshows 
FOR SELECT 
USING (is_active = true);

-- إنشاء دالة آمنة لإنشاء السلايدات تتجاوز قيود RLS
CREATE OR REPLACE FUNCTION public.create_slideshow_bypass_rls(
  p_account_id uuid,
  p_title text,
  p_images text[],
  p_interval_seconds integer DEFAULT 5
)
RETURNS uuid
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
