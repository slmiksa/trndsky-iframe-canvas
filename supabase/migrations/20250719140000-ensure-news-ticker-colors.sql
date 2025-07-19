-- إضافة حقول الألوان لجدول شريط الأخبار
-- التحقق من وجود الجدول أولاً
DO $$ 
BEGIN
    -- إنشاء الجدول إذا لم يكن موجوداً (احتياطي)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'news_ticker') THEN
        CREATE TABLE news_ticker (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT,
            is_active BOOLEAN DEFAULT true,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            background_color VARCHAR(7) DEFAULT '#2563eb',
            text_color VARCHAR(7) DEFAULT '#ffffff'
        );
        
        -- إنشاء الفهارس
        CREATE INDEX IF NOT EXISTS idx_news_ticker_account_id ON news_ticker(account_id);
        CREATE INDEX IF NOT EXISTS idx_news_ticker_active ON news_ticker(is_active);
        CREATE INDEX IF NOT EXISTS idx_news_ticker_order ON news_ticker(display_order);
        
        -- تطبيق RLS
        ALTER TABLE news_ticker ENABLE ROW LEVEL SECURITY;
        
        -- سياسات RLS
        CREATE POLICY "Users can view news for their account" ON news_ticker
            FOR SELECT USING (
                account_id IN (
                    SELECT ur.account_id 
                    FROM user_roles ur 
                    WHERE ur.user_id = auth.uid()
                )
            );
            
        CREATE POLICY "Users can manage news for their account" ON news_ticker
            FOR ALL USING (
                account_id IN (
                    SELECT ur.account_id 
                    FROM user_roles ur 
                    WHERE ur.user_id = auth.uid()
                )
            );
    ELSE
        -- إضافة الحقول إذا لم تكن موجودة
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_ticker' AND column_name = 'background_color') THEN
            ALTER TABLE news_ticker ADD COLUMN background_color VARCHAR(7) DEFAULT '#2563eb';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_ticker' AND column_name = 'text_color') THEN
            ALTER TABLE news_ticker ADD COLUMN text_color VARCHAR(7) DEFAULT '#ffffff';
        END IF;
        
        -- تحديث الأخبار الموجودة بالألوان الافتراضية
        UPDATE news_ticker 
        SET 
            background_color = COALESCE(background_color, '#2563eb'),
            text_color = COALESCE(text_color, '#ffffff')
        WHERE background_color IS NULL OR text_color IS NULL;
    END IF;
END $$;