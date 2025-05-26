
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NewsItem {
  id: string;
  title: string;
  content: string | null;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
}

interface NewsTickerDisplayProps {
  accountId: string;
}

const NewsTickerDisplay: React.FC<NewsTickerDisplayProps> = ({ accountId }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchNews = async () => {
    try {
      console.log('🔍 جاري تحميل الأخبار للعرض:', accountId);
      const { data, error } = await supabase
        .from('news_ticker')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ خطأ في تحميل الأخبار:', error);
        return;
      }

      console.log('✅ تم تحميل الأخبار:', data?.length || 0);
      setNewsItems(data || []);
      
      if (data && data.length > 0 && currentIndex >= data.length) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('❌ خطأ في fetchNews:', error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [accountId]);

  // الاشتراك في التحديثات المباشرة
  useEffect(() => {
    const channel = supabase
      .channel(`news_ticker_${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_ticker',
          filter: `account_id=eq.${accountId}`
        },
        (payload) => {
          console.log('📰 تحديث في الأخبار:', payload.eventType);
          fetchNews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  // تدوير الأخبار كل 5 ثوان
  useEffect(() => {
    if (newsItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [newsItems.length]);

  if (!newsItems.length) {
    return null;
  }

  const currentNews = newsItems[currentIndex];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white z-40">
      <div className="flex items-center px-4 py-2">
        <div className="flex-shrink-0 bg-white text-blue-600 px-3 py-1 rounded-md text-sm font-bold ml-4">
          أخبار
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            <span className="font-semibold ml-2">{currentNews.title}</span>
            {currentNews.content && (
              <span className="text-blue-100">- {currentNews.content}</span>
            )}
          </div>
        </div>
        {newsItems.length > 1 && (
          <div className="flex-shrink-0 text-xs text-blue-200 mr-4">
            {currentIndex + 1} / {newsItems.length}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
        
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default NewsTickerDisplay;
