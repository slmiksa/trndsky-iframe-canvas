-- فحص هيكل جدول news_ticker والتأكد من وجود حقول الألوان

-- إظهار هيكل الجدول الحالي
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'news_ticker' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- التحقق من وجود حقول الألوان
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'news_ticker' 
            AND column_name = 'background_color'
    ) THEN 'موجود' ELSE 'غير موجود' END as background_color_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'news_ticker' 
            AND column_name = 'text_color'
    ) THEN 'موجود' ELSE 'غير موجود' END as text_color_status;

-- إذا لم تكن موجودة، أضفها الآن
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_ticker' AND column_name = 'background_color') THEN
        ALTER TABLE news_ticker ADD COLUMN background_color VARCHAR(7) DEFAULT '#2563eb';
        RAISE NOTICE 'تم إضافة حقل background_color';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_ticker' AND column_name = 'text_color') THEN
        ALTER TABLE news_ticker ADD COLUMN text_color VARCHAR(7) DEFAULT '#ffffff';
        RAISE NOTICE 'تم إضافة حقل text_color';
    END IF;
END $$;