-- إضافة حقول الألوان لجدول شريط الأخبار
ALTER TABLE news_ticker 
ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#ffffff';

-- تحديث الأخبار الموجودة بالألوان الافتراضية
UPDATE news_ticker 
SET 
    background_color = COALESCE(background_color, '#2563eb'),
    text_color = COALESCE(text_color, '#ffffff')
WHERE background_color IS NULL OR text_color IS NULL;