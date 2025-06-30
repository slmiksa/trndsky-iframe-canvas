
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

-- إضافة فهرس للبريد الإلكتروني
CREATE INDEX idx_subscription_requests_email ON public.subscription_requests(email);

-- إضافة فهرس للحالة
CREATE INDEX idx_subscription_requests_status ON public.subscription_requests(status);

-- إضافة تريجر لتحديث updated_at
CREATE TRIGGER update_subscription_requests_updated_at
  BEFORE UPDATE ON public.subscription_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
