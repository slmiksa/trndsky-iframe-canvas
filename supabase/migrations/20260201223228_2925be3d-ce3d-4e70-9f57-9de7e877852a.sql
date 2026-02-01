-- إنشاء enum لحالة الحساب
CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'pending');

-- إنشاء جدول الحسابات
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  database_name TEXT NOT NULL,
  status public.account_status DEFAULT 'active',
  rotation_interval INTEGER DEFAULT 15,
  activation_start_date TIMESTAMP WITH TIME ZONE,
  activation_end_date TIMESTAMP WITH TIME ZONE,
  is_subscription_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول super_admins
CREATE TABLE public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  account_id UUID REFERENCES public.accounts(id),
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول السلايدات
CREATE TABLE public.account_slideshows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  media_type TEXT DEFAULT 'images',
  interval_seconds INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول news_ticker
CREATE TABLE public.news_ticker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  background_color VARCHAR(7) DEFAULT '#2563eb',
  text_color VARCHAR(7) DEFAULT '#ffffff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الإشعارات
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  position TEXT DEFAULT 'bottom-right',
  display_duration INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول break_timers
CREATE TABLE public.break_timers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  position TEXT DEFAULT 'center',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول account_websites
CREATE TABLE public.account_websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  website_title TEXT,
  iframe_content TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول طلبات الاشتراك
CREATE TABLE public.subscription_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول renewal_notifications
CREATE TABLE public.renewal_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول gallery_images
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء الفهارس
CREATE INDEX idx_accounts_email ON public.accounts(email);
CREATE INDEX idx_account_slideshows_account_id ON public.account_slideshows(account_id);
CREATE INDEX idx_account_slideshows_is_active ON public.account_slideshows(is_active);
CREATE INDEX idx_news_ticker_account_id ON public.news_ticker(account_id);
CREATE INDEX idx_notifications_account_id ON public.notifications(account_id);
CREATE INDEX idx_break_timers_account_id ON public.break_timers(account_id);
CREATE INDEX idx_subscription_requests_email ON public.subscription_requests(email);
CREATE INDEX idx_subscription_requests_status ON public.subscription_requests(status);

-- إنشاء دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء triggers
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_account_slideshows_updated_at BEFORE UPDATE ON public.account_slideshows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_ticker_updated_at BEFORE UPDATE ON public.news_ticker FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_break_timers_updated_at BEFORE UPDATE ON public.break_timers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_account_websites_updated_at BEFORE UPDATE ON public.account_websites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_requests_updated_at BEFORE UPDATE ON public.subscription_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gallery_images_updated_at BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- دالة للتأكد من أن slideshow واحد فقط نشط لكل حساب
CREATE OR REPLACE FUNCTION public.ensure_single_active_slideshow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.account_slideshows 
    SET is_active = false 
    WHERE account_id = NEW.account_id AND id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active_slideshow_trigger 
  BEFORE INSERT OR UPDATE ON public.account_slideshows 
  FOR EACH ROW EXECUTE FUNCTION ensure_single_active_slideshow();

-- إنشاء دوال مساعدة
CREATE OR REPLACE FUNCTION public.get_all_slideshows_for_account(p_account_id UUID)
RETURNS SETOF public.account_slideshows AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.account_slideshows WHERE account_id = p_account_id ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_active_slideshows_for_account(p_account_id UUID)
RETURNS SETOF public.account_slideshows AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.account_slideshows WHERE account_id = p_account_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_slideshow_bypass_rls(
  p_account_id UUID,
  p_title TEXT,
  p_images TEXT[],
  p_interval_seconds INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.account_slideshows (account_id, title, images, interval_seconds)
  VALUES (p_account_id, p_title, p_images, p_interval_seconds)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تفعيل RLS على الجداول
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_slideshows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_ticker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للسماح بالوصول العام (لأن النظام يستخدم مصادقة مخصصة)
CREATE POLICY "Allow public access to accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to super_admins" ON public.super_admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to account_slideshows" ON public.account_slideshows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to news_ticker" ON public.news_ticker FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to break_timers" ON public.break_timers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to account_websites" ON public.account_websites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to subscription_requests" ON public.subscription_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to renewal_notifications" ON public.renewal_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to gallery_images" ON public.gallery_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to user_roles" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);

-- إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'slideshow-images', 
  'slideshow-images', 
  true, 
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- سياسات التخزين
CREATE POLICY "Allow public read access on slideshow images" ON storage.objects
FOR SELECT USING (bucket_id = 'slideshow-images');

CREATE POLICY "Allow public upload of slideshow images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'slideshow-images');

CREATE POLICY "Allow public update of slideshow images" ON storage.objects
FOR UPDATE USING (bucket_id = 'slideshow-images');

CREATE POLICY "Allow public delete of slideshow images" ON storage.objects
FOR DELETE USING (bucket_id = 'slideshow-images');

-- إضافة مدير عام افتراضي (كلمة المرور: admin123)
INSERT INTO public.super_admins (username, password_hash)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT (username) DO NOTHING;