
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
  const lastWebsitesLength = useRef(websites.length);

  console.log('🎯 ClientPageContent rendered with:');
  console.log('📊 عدد المواقع:', websites.length);
  console.log('🌐 المواقع:', websites.map(w => ({ id: w.id, url: w.website_url, title: w.website_title })));
  console.log('⏱️ فترة التبديل:', rotationInterval, 'ثانية');

  // Clear any existing interval when component unmounts or websites change
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        console.log('🧹 تنظيف مؤقت التبديل عند إلغاء التحميل');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Reset index when websites list changes significantly
  useEffect(() => {
    if (websites.length !== lastWebsitesLength.current) {
      console.log('🔄 تغيير في عدد المواقع من', lastWebsitesLength.current, 'إلى', websites.length);
      lastWebsitesLength.current = websites.length;
      
      if (websites.length === 0) {
        setCurrentWebsiteIndex(0);
      } else if (currentWebsiteIndex >= websites.length) {
        setCurrentWebsiteIndex(0);
      }
    }
  }, [websites.length, currentWebsiteIndex]);

  // Stable rotation timer
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (websites.length <= 1) {
      console.log('⏭️ عدد المواقع غير كافٍ للتبديل:', websites.length);
      return;
    }

    console.log('🔄 بدء تبديل المواقع الثابت - عدد المواقع:', websites.length);
    console.log('⏱️ فترة التبديل:', rotationInterval, 'ثانية');
    
    intervalRef.current = setInterval(() => {
      setCurrentWebsiteIndex((prev) => {
        const newIndex = (prev + 1) % websites.length;
        console.log('🔄 التبديل الثابت إلى الموقع رقم:', newIndex + 1, 'من', websites.length);
        return newIndex;
      });
    }, rotationInterval * 1000);

    return () => {
      if (intervalRef.current) {
        console.log('🧹 تنظيف مؤقت التبديل');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [websites.length, rotationInterval]);

  const currentWebsite = websites.length > 0 ? websites[currentWebsiteIndex] : null;

  console.log('🎯 الموقع المختار للعرض:', currentWebsite ? {
    index: currentWebsiteIndex,
    id: currentWebsite.id,
    url: currentWebsite.website_url,
    title: currentWebsite.website_title
  } : 'لا يوجد موقع');

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="flex-1">
        {websites.length === 0 ? (
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
        ) : currentWebsite ? (
          <div className="h-screen">
            <iframe
              key={`stable-${currentWebsite.id}-${currentWebsiteIndex}`}
              src={currentWebsite.website_url}
              title={currentWebsite.website_title || currentWebsite.website_url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
              onLoad={() => console.log('✅ تم تحميل الموقع بشكل ثابت:', currentWebsite.website_url)}
              onError={() => console.error('❌ خطأ في تحميل الموقع:', currentWebsite.website_url)}
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
