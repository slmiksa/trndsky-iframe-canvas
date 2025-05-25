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
  const stableWebsites = useRef<Website[]>([]);
  const currentWebsiteRef = useRef<Website | null>(null);
  const lastRotationTime = useRef<number>(0);

  console.log('🎯 ClientPageContent محسن ومستقر:');
  console.log('📊 عدد المواقع:', websites.length);
  console.log('⏱️ فترة التبديل:', rotationInterval, 'ثانية');

  // Enhanced website stability management
  useEffect(() => {
    if (!mountedRef.current) return;

    // Create a stable copy only when websites actually change
    const websitesChanged = JSON.stringify(websites) !== JSON.stringify(stableWebsites.current);
    
    if (websitesChanged) {
      console.log('🔄 تحديث المواقع المستقرة - تغيير حقيقي');
      stableWebsites.current = [...websites];
      
      // Reset index if current is out of bounds
      if (currentWebsiteIndex >= websites.length && websites.length > 0) {
        console.log('🔄 إعادة تعيين الفهرس إلى 0');
        setCurrentWebsiteIndex(0);
      }
    }
  }, [websites, currentWebsiteIndex]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        console.log('🧹 تنظيف مؤقت التبديل عند إلغاء التحميل');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Enhanced stable rotation with better timing control
  useEffect(() => {
    if (!mountedRef.current) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const activeWebsites = stableWebsites.current;

    if (activeWebsites.length <= 1) {
      console.log('⏭️ عدد المواقع غير كافٍ للتبديل:', activeWebsites.length);
      return;
    }

    console.log('🔄 بدء التبديل المحسن:', {
      websitesCount: activeWebsites.length,
      interval: rotationInterval
    });
    
    // Enhanced interval with minimum safety threshold
    const safeInterval = Math.max(rotationInterval * 1000, 5000);
    
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      
      const now = Date.now();
      
      // Additional safety check to prevent too rapid rotation
      if (now - lastRotationTime.current < 4000) {
        console.log('⏭️ منع التبديل السريع');
        return;
      }
      
      setCurrentWebsiteIndex((prev) => {
        const newIndex = (prev + 1) % activeWebsites.length;
        lastRotationTime.current = now;
        
        console.log('🔄 التبديل المحسن إلى الموقع:', {
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
  }, [rotationInterval, stableWebsites.current.length]);

  // Enhanced current website management
  const currentWebsite = stableWebsites.current.length > 0 ? stableWebsites.current[currentWebsiteIndex] : null;
  
  // Only update ref when website actually changes
  if (currentWebsite && currentWebsite.id !== currentWebsiteRef.current?.id) {
    currentWebsiteRef.current = currentWebsite;
    console.log('🎯 الموقع الجديد محدد:', {
      index: currentWebsiteIndex,
      id: currentWebsite.id,
      url: currentWebsite.website_url,
      title: currentWebsite.website_title
    });
  }

  // Enhanced error handling for iframe
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
        {stableWebsites.current.length === 0 ? (
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
              key={`enhanced-${currentWebsiteRef.current.id}-${Date.now()}`}
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
