
-- إنشاء جدول السلايدات
CREATE TABLE public.account_slideshows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  interval_seconds INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX idx_account_slideshows_account_id ON public.account_slideshows(account_id);
CREATE INDEX idx_account_slideshows_is_active ON public.account_slideshows(is_active);

-- إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'slideshow-images', 
  'slideshow-images', 
  true, 
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- إنشاء سياسات التخزين
CREATE POLICY "Allow public read access on slideshow images" ON storage.objects
FOR SELECT USING (bucket_id = 'slideshow-images');

CREATE POLICY "Allow authenticated upload of slideshow images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'slideshow-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their slideshow images" ON storage.objects
FOR UPDATE USING (bucket_id = 'slideshow-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their slideshow images" ON storage.objects
FOR DELETE USING (bucket_id = 'slideshow-images' AND auth.role() = 'authenticated');

-- إضافة trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_account_slideshows_updated_at 
  BEFORE UPDATE ON public.account_slideshows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- التأكد من أن slideshow واحد فقط يكون نشط لكل حساب
CREATE OR REPLACE FUNCTION ensure_single_active_slideshow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.account_slideshows 
    SET is_active = false 
    WHERE account_id = NEW.account_id AND id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_active_slideshow_trigger 
  BEFORE INSERT OR UPDATE ON public.account_slideshows 
  FOR EACH ROW EXECUTE FUNCTION ensure_single_active_slideshow();
