
-- حذف جميع السياسات الحالية أولاً
DROP POLICY IF EXISTS "Allow public read access to slideshows" ON public.account_slideshows;
DROP POLICY IF EXISTS "Allow public insert of slideshows" ON public.account_slideshows;
DROP POLICY IF EXISTS "Allow public update of slideshows" ON public.account_slideshows;
DROP POLICY IF EXISTS "Allow public delete of slideshows" ON public.account_slideshows;
DROP POLICY IF EXISTS "Users can view slideshows for their accounts" ON public.account_slideshows;
DROP POLICY IF EXISTS "Users can create slideshows for their accounts" ON public.account_slideshows;
DROP POLICY IF EXISTS "Users can update slideshows for their accounts" ON public.account_slideshows;
DROP POLICY IF EXISTS "Users can delete slideshows for their accounts" ON public.account_slideshows;
DROP POLICY IF EXISTS "Allow public read access to active slideshows" ON public.account_slideshows;
DROP POLICY IF EXISTS "Authenticated users can manage slideshows" ON public.account_slideshows;

-- إيقاف RLS مؤقتاً للاختبار
ALTER TABLE public.account_slideshows DISABLE ROW LEVEL SECURITY;

-- أو بدلاً من ذلك، إنشاء سياسة بسيطة جداً تسمح بكل شيء
-- ALTER TABLE public.account_slideshows ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations" ON public.account_slideshows FOR ALL USING (true) WITH CHECK (true);
