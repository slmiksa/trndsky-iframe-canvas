
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Account {
  id: string;
  name: string;
}

interface Website {
  id: string;
  website_url: string;
  website_title: string | null;
}

interface ClientPageContentProps {
  account: Account;
  websites: Website[];
  rotationInterval: number;
}

const ClientPageContent: React.FC<ClientPageContentProps> = ({ 
  account, 
  websites, 
  rotationInterval 
}) => {
  const [currentWebsiteIndex, setCurrentWebsiteIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);
  const stableWebsitesRef = useRef<Website[]>([]);
  const currentWebsiteRef = useRef<Website | null>(null);
  const lastRotationTime = useRef<number>(0);
  const iframeKeyRef = useRef<string>('');

  console.log('🎯 ClientPageContent استجابة سريعة للتغييرات:');
  console.log('📊 عدد المواقع:', websites.length);
  console.log('⏱️ فترة التبديل:', rotationInterval, 'ثانية');

  // تحديث فوري للمواقع عند التغيير
  useEffect(() => {
    if (!mountedRef.current) return;

    const websitesChanged = JSON.stringify(websites) !== JSON.stringify(stableWebsitesRef.current);
    
    if (websitesChanged) {
      console.log('🔄 تحديث فوري للمواقع - تغيير مكتشف');
      stableWebsitesRef.current = [...websites];
      
      // إعادة تعيين الفهرس إذا كان خارج النطاق
      if (currentWebsiteIndex >= websites.length && websites.length > 0) {
        console.log('🔄 إعادة تعيين الفهرس إلى 0');
        setCurrentWebsiteIndex(0);
      } else if (websites.length === 0) {
        console.log('📭 لا توجد مواقع نشطة');
        setCurrentWebsiteIndex(0);
      }
    }
  }, [websites, currentWebsiteIndex]);

  // تنظيف عند الإلغاء
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        console.log('🧹 تنظيف مؤقت التبديل عند الإلغاء');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // تبديل محسن مع استجابة للتغييرات
  useEffect(() => {
    if (!mountedRef.current) return;

    // مسح المؤقت السابق
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const activeWebsites = stableWebsitesRef.current;

    if (activeWebsites.length <= 1) {
      console.log('⏭️ عدد المواقع غير كافٍ للتبديل:', activeWebsites.length);
      return;
    }

    console.log('🔄 بدء التبديل المحسن:', {
      websitesCount: activeWebsites.length,
      interval: rotationInterval
    });
    
    // فترة تبديل محسنة مع حد أدنى 5 ثوان
    const safeInterval = Math.max(rotationInterval * 1000, 5000);
    
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      
      const now = Date.now();
      
      // حماية من التبديل السريع
      if (now - lastRotationTime.current < 4000) {
        console.log('⏭️ منع التبديل السريع');
        return;
      }
      
      setCurrentWebsiteIndex((prev) => {
        const newIndex = (prev + 1) % activeWebsites.length;
        lastRotationTime.current = now;
        
        console.log('🔄 التبديل المحسن:', {
          newIndex: newIndex + 1,
          total: activeWebsites.length,
          websiteId: activeWebsites[newIndex]?.id
        });
        
        return newIndex;
      });
    }, safeInterval);

    return () => {
      if (intervalRef.current) {
        console.log('🧹 تنظيف مؤقت التبديل');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [rotationInterval, stableWebsitesRef.current.length]);

  // إدارة الموقع الحالي مع تحديث المفتاح
  const currentWebsite = stableWebsitesRef.current.length > 0 ? stableWebsitesRef.current[currentWebsiteIndex] : null;
  
  // تحديث مفتاح iframe عند تغيير الموقع فقط
  if (currentWebsite && currentWebsite.id !== currentWebsiteRef.current?.id) {
    currentWebsiteRef.current = currentWebsite;
    iframeKeyRef.current = `website-${currentWebsite.id}-${Date.now()}`;
    console.log('🎯 الموقع الجديد:', {
      index: currentWebsiteIndex,
      id: currentWebsite.id,
      url: currentWebsite.website_url,
      title: currentWebsite.website_title
    });
  }

  // معالجات iframe محسنة
  const handleIframeLoad = useCallback(() => {
    if (currentWebsiteRef.current) {
      console.log('✅ تم تحميل الموقع بنجاح:', currentWebsiteRef.current.website_url);
    }
  }, []);

  const handleIframeError = useCallback(() => {
    if (currentWebsiteRef.current) {
      console.error('❌ خطأ في تحميل الموقع:', currentWebsiteRef.current.website_url);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="flex-1">
        {stableWebsitesRef.current.length === 0 ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-6">📺</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                مرحباً بك في {account.name}
              </h2>
              <p className="text-lg text-gray-600 mb-2">لا توجد مواقع نشطة حالياً</p>
              <p className="text-sm text-gray-400">
                سيتم عرض المواقع هنا فور تفعيلها من لوحة التحكم
              </p>
              <div className="mt-6 animate-pulse">
                <div className="inline-block w-3 h-3 bg-blue-500 rounded-full mx-1"></div>
                <div className="inline-block w-3 h-3 bg-blue-500 rounded-full mx-1" style={{animationDelay: '0.2s'}}></div>
                <div className="inline-block w-3 h-3 bg-blue-500 rounded-full mx-1" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        ) : currentWebsiteRef.current ? (
          <div className="h-screen">
            <iframe
              key={iframeKeyRef.current}
              src={currentWebsiteRef.current.website_url}
              title={currentWebsiteRef.current.website_title || currentWebsiteRef.current.website_url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-top-navigation"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{
                backgroundColor: '#f5f5f5',
                transition: 'opacity 0.3s ease-in-out'
              }}
            />
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                جاري التحميل...
              </h2>
              <p className="text-gray-600">يتم تحضير المحتوى</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientPageContent;
