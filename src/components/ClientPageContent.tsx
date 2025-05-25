
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

  // Enhanced website rotation with immediate response to changes
  useEffect(() => {
    if (websites.length <= 1) {
      console.log('🚀 Not enough websites for rotation. Count:', websites.length);
      return;
    }

    console.log('🚀 Setting up website rotation. Websites count:', websites.length);
    console.log('🚀 Rotation interval:', rotationInterval, 'seconds');

    const interval = setInterval(() => {
      setCurrentWebsiteIndex((prev) => {
        const newIndex = (prev + 1) % websites.length;
        console.log('🚀 Rotating to website index:', newIndex);
        return newIndex;
      });
    }, rotationInterval * 1000);

    return () => {
      console.log('🚀 Cleaning up rotation interval');
      clearInterval(interval);
    };
  }, [websites.length, rotationInterval]);

  // Enhanced websites list change handling for instant updates
  useEffect(() => {
    console.log('🚀 INSTANT websites list change detected!');
    console.log('🚀 New websites count:', websites.length);
    console.log('🚀 Current website index:', currentWebsiteIndex);
    console.log('🚀 Active websites:', websites.map(w => ({ id: w.id, url: w.website_url })));
    
    if (websites.length === 0) {
      console.log('🚀 No active websites, resetting index to 0');
      setCurrentWebsiteIndex(0);
    } else if (currentWebsiteIndex >= websites.length) {
      console.log('🚀 Current index out of bounds, resetting to 0');
      setCurrentWebsiteIndex(0);
    }
  }, [websites, currentWebsiteIndex]);

  const currentWebsite = websites.length > 0 ? websites[currentWebsiteIndex] : null;

  console.log('🚀 Current website to display:', currentWebsite);
  console.log('🚀 Is there a current website?', !!currentWebsite);

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
                🚀 التحديثات المباشرة السريعة نشطة
              </p>
              <p className="text-xs text-gray-300 mt-1">
                عدد المواقع: {websites.length}
              </p>
            </div>
          </div>
        ) : currentWebsite ? (
          <div className="h-screen">
            <iframe
              key={`${currentWebsite.id}-${Date.now()}`} // Force re-render on changes
              src={currentWebsite.website_url}
              title={currentWebsite.website_title || currentWebsite.website_url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
            />
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                جاري التحميل...
              </h2>
              <p className="text-gray-600">يتم تحديث المحتوى بسرعة</p>
              <p className="text-xs text-gray-400 mt-2">
                عدد المواقع: {websites.length} | الموقع الحالي: {currentWebsiteIndex}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientPageContent;
