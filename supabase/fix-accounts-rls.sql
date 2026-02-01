-- إصلاح سياسات RLS لجدول accounts
-- يجب تشغيل هذا الملف في Supabase SQL Editor

-- 1. التأكد من تفعيل RLS على الجدول
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 2. حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Allow public read access to accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow all operations on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow select on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow insert on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow update on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow delete on accounts" ON public.accounts;

-- 3. إنشاء سياسة للسماح بالقراءة العامة (بدون كلمة المرور - سيتم التعامل معها في الكود)
CREATE POLICY "Allow public read access to accounts"
ON public.accounts FOR SELECT
USING (true);

-- 4. إنشاء سياسة للسماح بالإدراج للجميع (مؤقتاً - للمدير العام)
CREATE POLICY "Allow public insert on accounts"
ON public.accounts FOR INSERT
WITH CHECK (true);

-- 5. إنشاء سياسة للسماح بالتحديث للجميع (مؤقتاً - للمدير العام)
CREATE POLICY "Allow public update on accounts"
ON public.accounts FOR UPDATE
USING (true);

-- 6. إنشاء سياسة للسماح بالحذف للجميع (مؤقتاً - للمدير العام)
CREATE POLICY "Allow public delete on accounts"
ON public.accounts FOR DELETE
USING (true);

-- ملاحظة: هذه السياسات تسمح بالوصول الكامل للجدول
-- في بيئة الإنتاج، يجب تقييد هذه السياسات بناءً على نظام المصادقة المستخدم

-- إصلاح سياسات RLS لجدول subscription_requests
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to subscription_requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Allow public insert on subscription_requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Allow public update on subscription_requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Allow public delete on subscription_requests" ON public.subscription_requests;

CREATE POLICY "Allow public read access to subscription_requests"
ON public.subscription_requests FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on subscription_requests"
ON public.subscription_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on subscription_requests"
ON public.subscription_requests FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on subscription_requests"
ON public.subscription_requests FOR DELETE
USING (true);
