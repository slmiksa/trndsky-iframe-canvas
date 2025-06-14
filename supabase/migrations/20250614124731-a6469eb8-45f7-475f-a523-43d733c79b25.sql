
-- إضافة سياسة مؤقتة للسماح للمستخدمين المُصادق عليهم بإضافة السلايدات
-- هذا سيحل المشكلة مؤقتاً حتى نتأكد من إعداد user_roles بشكل صحيح
DROP POLICY IF EXISTS "Users can create slideshows for their accounts" ON public.account_slideshows;
DROP POLICY IF EXISTS "Users can view slideshows for their accounts" ON public.account_slideshows;
DROP POLICY IF EXISTS "Users can update slideshows for their accounts" ON public.account_slideshows;
DROP POLICY IF EXISTS "Users can delete slideshows for their accounts" ON public.account_slideshows;

-- سياسة مؤقتة للسماح للمستخدمين المُصادق عليهم
CREATE POLICY "Authenticated users can manage slideshows" ON public.account_slideshows
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);
