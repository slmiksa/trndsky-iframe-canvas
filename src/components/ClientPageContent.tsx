
import React, { useState, useEffect } from 'react';

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

  console.log('🎯 ClientPageContent rendered with:');
  console.log('📊 عدد المواقع:', websites.length);
  console.log('🌐 المواقع:', websites.map(w => ({ id: w.id, url: w.website_url, title: w.website_title })));
  console.log('⏱️ فترة التبديل:', rotationInterval, 'ثانية');

  // تبديل المواقع التلقائي
  useEffect(() => {
    if (websites.length <= 1) {
      console.log('⏭️ عدد المواقع غير كافٍ للتبديل:', websites.length);
      return;
    }

    console.log('🔄 بدء تبديل المواقع - عدد المواقع:', websites.length);
    
    const interval = setInterval(() => {
      setCurrentWebsiteIndex((prev) => {
        const newIndex = (prev + 1) % websites.length;
        console.log('🔄 التبديل إلى الموقع رقم:', newIndex + 1, 'من', websites.length);
        return newIndex;
      });
    }, rotationInterval * 1000);

    return () => {
      console.log('🧹 تنظيف مؤقت التبديل');
      clearInterval(interval);
    };
  }, [websites.length, rotationInterval]);

  // إعادة تعيين الفهرس عند تغيير قائمة المواقع
  useEffect(() => {
    if (websites.length === 0) {
      console.log('📭 لا توجد مواقع، إعادة تعيين الفهرس');
      setCurrentWebsiteIndex(0);
    } else if (currentWebsiteIndex >= websites.length) {
      console.log('⚠️ الفهرس خارج النطاق، إعادة تعيين إلى 0');
      setCurrentWebsiteIndex(0);
    }
  }, [websites.length, currentWebsiteIndex]);

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
              key={`${currentWebsite.id}-${currentWebsiteIndex}-${Date.now()}`}
              src={currentWebsite.website_url}
              title={currentWebsite.website_title || currentWebsite.website_url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
              onLoad={() => console.log('✅ تم تحميل الموقع:', currentWebsite.website_url)}
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
