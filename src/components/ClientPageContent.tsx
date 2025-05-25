
import React, { useState, useEffect, useRef } from 'react';

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
  const lastWebsitesUpdate = useRef<number>(Date.now());
  const stableWebsites = useRef<Website[]>(websites);
  const currentWebsiteRef = useRef<Website | null>(null);

  console.log('🎯 ClientPageContent مع استقرار محسن:');
  console.log('📊 عدد المواقع:', websites.length);
  console.log('⏱️ فترة التبديل:', rotationInterval, 'ثانية');

  // Update stable websites only when actually needed
  useEffect(() => {
    const websitesChanged = JSON.stringify(websites) !== JSON.stringify(stableWebsites.current);
    
    if (websitesChanged) {
      console.log('🔄 تحديث المواقع المستقرة');
      stableWebsites.current = [...websites];
      lastWebsitesUpdate.current = Date.now();
      
      // Reset index if needed
      if (currentWebsiteIndex >= websites.length && websites.length > 0) {
        console.log('🔄 إعادة تعيين الفهرس إلى 0');
        setCurrentWebsiteIndex(0);
      }
    }
  }, [websites, currentWebsiteIndex]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        console.log('🧹 تنظيف مؤقت التبديل عند إلغاء التحميل');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Stable rotation timer
  useEffect(() => {
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

    console.log('🔄 بدء التبديل المستقر - عدد المواقع:', activeWebsites.length);
    console.log('⏱️ فترة التبديل:', rotationInterval, 'ثانية');
    
    // Set minimum interval for stability
    const actualInterval = Math.max(rotationInterval * 1000, 5000);
    
    intervalRef.current = setInterval(() => {
      setCurrentWebsiteIndex((prev) => {
        const newIndex = (prev + 1) % activeWebsites.length;
        console.log('🔄 التبديل المستقر إلى الموقع رقم:', newIndex + 1, 'من', activeWebsites.length);
        return newIndex;
      });
    }, actualInterval);

    return () => {
      if (intervalRef.current) {
        console.log('🧹 تنظيف مؤقت التبديل');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [rotationInterval, stableWebsites.current.length]);

  // Get current website from stable reference
  const currentWebsite = stableWebsites.current.length > 0 ? stableWebsites.current[currentWebsiteIndex] : null;
  
  // Only update ref if website actually changed
  if (currentWebsite && currentWebsite.id !== currentWebsiteRef.current?.id) {
    currentWebsiteRef.current = currentWebsite;
    console.log('🎯 الموقع الجديد المختار:', {
      index: currentWebsiteIndex,
      id: currentWebsite.id,
      url: currentWebsite.website_url,
      title: currentWebsite.website_title
    });
  }

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
              key={`stable-${currentWebsiteRef.current.id}`}
              src={currentWebsiteRef.current.website_url}
              title={currentWebsiteRef.current.website_title || currentWebsiteRef.current.website_url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
              onLoad={() => {
                console.log('✅ تم تحميل الموقع بشكل مستقر:', currentWebsiteRef.current?.website_url);
              }}
              onError={() => {
                console.error('❌ خطأ في تحميل الموقع:', currentWebsiteRef.current?.website_url);
              }}
            />
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
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
