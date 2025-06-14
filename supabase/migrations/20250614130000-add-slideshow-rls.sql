
-- إضافة سياسات RLS لجدول account_slideshows
ALTER TABLE public.account_slideshows ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة السلايدات (للعرض العام)
DROP POLICY IF EXISTS "Allow public read access to slideshows" ON public.account_slideshows;
CREATE POLICY "Allow public read access to slideshows" 
ON public.account_slideshows 
FOR SELECT 
USING (true);

-- السماح للجميع بإدراج السلايدات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public insert of slideshows" ON public.account_slideshows;
CREATE POLICY "Allow public insert of slideshows" 
ON public.account_slideshows 
FOR INSERT 
WITH CHECK (true);

-- السماح للجميع بتحديث السلايدات
DROP POLICY IF EXISTS "Allow public update of slideshows" ON public.account_slideshows;
CREATE POLICY "Allow public update of slideshows" 
ON public.account_slideshows 
FOR UPDATE 
USING (true);

-- السماح للجميع بحذف السلايدات
DROP POLICY IF EXISTS "Allow public delete of slideshows" ON public.account_slideshows;
CREATE POLICY "Allow public delete of slideshows" 
ON public.account_slideshows 
FOR DELETE 
USING (true);
