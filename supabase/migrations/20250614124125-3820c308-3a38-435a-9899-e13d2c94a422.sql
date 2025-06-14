
-- إضافة سياسات Row Level Security لجدول السلايدات
ALTER TABLE public.account_slideshows ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين بعرض السلايدات الخاصة بحساباتهم
CREATE POLICY "Users can view slideshows for their accounts" ON public.account_slideshows
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.account_id = account_slideshows.account_id 
    AND user_roles.role = 'account_user'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);

-- السماح للمستخدمين بإنشاء السلايدات لحساباتهم
CREATE POLICY "Users can create slideshows for their accounts" ON public.account_slideshows
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.account_id = account_slideshows.account_id 
    AND user_roles.role = 'account_user'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);

-- السماح للمستخدمين بتحديث السلايدات الخاصة بحساباتهم
CREATE POLICY "Users can update slideshows for their accounts" ON public.account_slideshows
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.account_id = account_slideshows.account_id 
    AND user_roles.role = 'account_user'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);

-- السماح للمستخدمين بحذف السلايدات الخاصة بحساباتهم
CREATE POLICY "Users can delete slideshows for their accounts" ON public.account_slideshows
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.account_id = account_slideshows.account_id 
    AND user_roles.role = 'account_user'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);

-- السماح بالوصول العام للقراءة (للصفحة العامة)
CREATE POLICY "Allow public read access to active slideshows" ON public.account_slideshows
FOR SELECT USING (is_active = true);
