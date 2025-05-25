
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

  // Optimized website rotation
  useEffect(() => {
    if (websites.length <= 1) return;

    console.log('🚀 Setting up FAST website rotation with interval:', rotationInterval, 'seconds');

    const interval = setInterval(() => {
      setCurrentWebsiteIndex((prev) => (prev + 1) % websites.length);
    }, rotationInterval * 1000);

    return () => clearInterval(interval);
  }, [websites.length, rotationInterval]);

  // Enhanced website list change handling for instant updates
  useEffect(() => {
    console.log('🚀 INSTANT websites list update. Current count:', websites.length);
    console.log('🚀 Current website index:', currentWebsiteIndex);
    
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
            </div>
          </div>
        ) : currentWebsite ? (
          <div className="h-screen">
            <iframe
              key={currentWebsite.id}
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientPageContent;
