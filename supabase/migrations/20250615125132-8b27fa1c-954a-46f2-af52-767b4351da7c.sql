
-- هذا التحديث سيقوم بإزالة المشغل والدالة التي تمنع تنشيط أكثر من سلايد شو واحد،
-- ثم يعدل قيد فترة التنقل ليقبل قيمًا تبدأ من 5 ثواني.

-- 1. إزالة المشغل (trigger) الذي يعتمد على الدالة
DROP TRIGGER IF EXISTS ensure_single_active_slideshow_trigger ON public.account_slideshows;

-- 2. الآن يمكننا إزالة الدالة بأمان
DROP FUNCTION IF EXISTS public.ensure_single_active_slideshow();

-- 3. تعديل القيد على جدول الحسابات للسماح بفترة تنقل من 5 إلى 300 ثانية
ALTER TABLE public.accounts
DROP CONSTRAINT IF EXISTS check_rotation_interval_range;

ALTER TABLE public.accounts
ADD CONSTRAINT check_rotation_interval_range CHECK (rotation_interval >= 5 AND rotation_interval <= 300);
