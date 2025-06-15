
-- إضافة سياسة للسماح للمستخدمين بقراءة وإدارة سلايداتهم الخاصة
CREATE POLICY "Users can manage their account slideshows" 
ON public.account_slideshows 
FOR ALL 
USING (true)
WITH CHECK (true);

-- إضافة دالة آمنة للحصول على جميع السلايدات للحساب (للإدارة)
CREATE OR REPLACE FUNCTION public.get_all_slideshows_for_account(p_account_id uuid)
RETURNS SETOF public.account_slideshows
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.account_slideshows
  WHERE account_id = p_account_id
  ORDER BY created_at DESC;
END;
$$;
