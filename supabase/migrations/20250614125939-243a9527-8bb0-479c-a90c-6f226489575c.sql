
-- إنشاء bucket للصور إذا لم يكن موجوداً
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'slideshow-images', 
  'slideshow-images', 
  true, 
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- حذف السياسات القديمة للتخزين
DROP POLICY IF EXISTS "Allow public read access on slideshow images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload of slideshow images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their slideshow images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their slideshow images" ON storage.objects;

-- إنشاء سياسات تخزين جديدة تسمح للجميع
CREATE POLICY "Allow public read access on slideshow images" ON storage.objects
FOR SELECT USING (bucket_id = 'slideshow-images');

CREATE POLICY "Allow public upload of slideshow images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'slideshow-images');

CREATE POLICY "Allow public update of slideshow images" ON storage.objects
FOR UPDATE USING (bucket_id = 'slideshow-images');

CREATE POLICY "Allow public delete of slideshow images" ON storage.objects
FOR DELETE USING (bucket_id = 'slideshow-images');
