
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

  console.log('🎯 ClientPageContent مستقر بدون وميض:');
  console.log('📊 عدد المواقع:', websites.length);
  console.log('⏱️ فترة التبديل:', rotationInterval, 'ثانية');

  // Enhanced website stability - only update when really necessary
  useEffect(() => {
    if (!mountedRef.current) return;

    const websitesChanged = JSON.stringify(websites) !== JSON.stringify(stableWebsitesRef.current);
    
    if (websitesChanged && websites.length > 0) {
      console.log('🔄 تحديث مستقر للمواقع - تغيير حقيقي مكتشف');
      stableWebsitesRef.current = [...websites];
      
      // Reset index only if current is out of bounds
      if (currentWebsiteIndex >= websites.length) {
        console.log('🔄 إعادة تعيين الفهرس إلى 0');
        setCurrentWebsiteIndex(0);
      }
    }
  }, [websites, currentWebsiteIndex]);

  // Cleanup on unmount
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

  // Super stable rotation with anti-flicker measures
  useEffect(() => {
    if (!mountedRef.current) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const activeWebsites = stableWebsitesRef.current;

    if (activeWebsites.length <= 1) {
      console.log('⏭️ عدد المواقع غير كافٍ للتبديل:', activeWebsites.length);
      return;
    }

    console.log('🔄 بدء التبديل المستقر بدون وميض:', {
      websitesCount: activeWebsites.length,
      interval: rotationInterval
    });
    
    // Much safer interval with anti-flicker protection
    const safeInterval = Math.max(rotationInterval * 1000, 8000); // Minimum 8 seconds
    
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      
      const now = Date.now();
      
      // Strong protection against rapid rotation
      if (now - lastRotationTime.current < 7000) {
        console.log('⏭️ منع التبديل السريع لتجنب الوميض');
        return;
      }
      
      setCurrentWebsiteIndex((prev) => {
        const newIndex = (prev + 1) % activeWebsites.length;
        lastRotationTime.current = now;
        
        console.log('🔄 التبديل المستقر بدون وميض:', {
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

  // Ultra stable current website management
  const currentWebsite = stableWebsitesRef.current.length > 0 ? stableWebsitesRef.current[currentWebsiteIndex] : null;
  
  // Only update iframe key when website actually changes to prevent flicker
  if (currentWebsite && currentWebsite.id !== currentWebsiteRef.current?.id) {
    currentWebsiteRef.current = currentWebsite;
    iframeKeyRef.current = `stable-${currentWebsite.id}`;
    console.log('🎯 الموقع الجديد مستقر:', {
      index: currentWebsiteIndex,
      id: currentWebsite.id,
      url: currentWebsite.website_url,
      title: currentWebsite.website_title
    });
  }

  // Enhanced iframe handlers
  const handleIframeLoad = useCallback(() => {
    if (currentWebsiteRef.current) {
      console.log('✅ تم تحميل الموقع بنجاح بدون وميض:', currentWebsiteRef.current.website_url);
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
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                مرحباً بك في {account.name}
              </h2>
              <p className="text-gray-600">لا توجد مواقع نشطة حالياً</p>
              <p className="text-sm text-gray-400 mt-2">
                سيتم عرض المواقع هنا عند إضافتها وتفعيلها
              </p>
            </div>
          </div>
        ) : currentWebsiteRef.current ? (
          <div className="h-screen">
            <iframe
              key={iframeKeyRef.current} // Stable key prevents unnecessary re-renders
              src={currentWebsiteRef.current.website_url}
              title={currentWebsiteRef.current.website_title || currentWebsiteRef.current.website_url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-top-navigation"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{
                backgroundColor: '#f5f5f5',
                transition: 'opacity 0.5s ease-in-out'
              }}
            />
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
