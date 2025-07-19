
-- إضافة دعم الفيديو لجدول السلايدات
ALTER TABLE public.account_slideshows 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'images',
ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';

-- تحديث bucket التخزين ليدعم الفيديو
UPDATE storage.buckets 
SET 
  file_size_limit = 157286400, -- 150MB للفيديوهات
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'
  ]
WHERE id = 'slideshow-images';

-- إضافة فهرس للبحث بنوع الوسائط
CREATE INDEX IF NOT EXISTS idx_account_slideshows_media_type 
ON public.account_slideshows(media_type);

-- دالة للتحقق من مدة الفيديو (يجب أن تكون أقل من 3 دقائق)
CREATE OR REPLACE FUNCTION validate_video_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- هذا مجرد trigger بسيط، التحقق الفعلي من المدة سيكون في التطبيق
  IF NEW.media_type = 'mixed' OR NEW.media_type = 'videos' THEN
    -- يمكن إضافة منطق إضافي هنا إذا لزم الأمر
    NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_video_duration_trigger 
  BEFORE INSERT OR UPDATE ON public.account_slideshows 
  FOR EACH ROW EXECUTE FUNCTION validate_video_duration();

-- تحديث الدالة الموجودة لتدعم الفيديو
CREATE OR REPLACE FUNCTION create_slideshow_bypass_rls(
  p_account_id UUID,
  p_title TEXT,
  p_images TEXT[] DEFAULT '{}',
  p_video_urls TEXT[] DEFAULT '{}',
  p_media_type VARCHAR(20) DEFAULT 'images',
  p_interval_seconds INTEGER DEFAULT 15
)
RETURNS UUID AS $$
DECLARE
  slideshow_id UUID;
BEGIN
  INSERT INTO public.account_slideshows (
    account_id, 
    title, 
    images, 
    video_urls,
    media_type,
    interval_seconds, 
    is_active
  )
  VALUES (
    p_account_id, 
    p_title, 
    p_images, 
    p_video_urls,
    p_media_type,
    p_interval_seconds, 
    false
  )
  RETURNING id INTO slideshow_id;
  
  RETURN slideshow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
