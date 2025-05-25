
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

  // Website rotation
  useEffect(() => {
    if (websites.length <= 1) return;

    console.log('🔄 Setting up website rotation with interval:', rotationInterval, 'seconds');

    const interval = setInterval(() => {
      setCurrentWebsiteIndex((prev) => (prev + 1) % websites.length);
    }, rotationInterval * 1000);

    return () => clearInterval(interval);
  }, [websites.length, rotationInterval]);

  // Reset current website index if needed
  useEffect(() => {
    if (websites && websites.length > 0) {
      setCurrentWebsiteIndex(prev => prev >= websites.length ? 0 : prev);
    } else {
      setCurrentWebsiteIndex(0);
    }
  }, [websites]);

  const currentWebsite = websites[currentWebsiteIndex];

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
                🔄 الاستماع للتحديثات المباشرة نشط
              </p>
            </div>
          </div>
        ) : currentWebsite ? (
          <div className="h-screen">
            <iframe
              src={currentWebsite.website_url}
              title={currentWebsite.website_title || currentWebsite.website_url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
            />
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default ClientPageContent;
