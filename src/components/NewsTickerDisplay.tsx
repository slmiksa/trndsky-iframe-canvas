
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
  const [fade, setFade] = useState(true);

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
      const activeNews = data || [];
      setNewsItems(activeNews);
      
      // إعادة تعيين الفهرس إذا لم تعد هناك أخبار نشطة
      if (activeNews.length === 0) {
        setCurrentIndex(0);
      } else if (activeNews.length <= currentIndex) {
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
    console.log('📡 إعداد قناة التحديثات المباشرة للأخبار');
    
    const channel = supabase
      .channel(`news_ticker_realtime_${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_ticker',
          filter: `account_id=eq.${accountId}`
        },
        (payload) => {
          console.log('📰 تحديث فوري في الأخبار:', payload.eventType, payload);
          
          // إعادة تحميل الأخبار النشطة فقط عند أي تغيير
          setTimeout(() => {
            fetchNews();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة قناة الأخبار:', status);
      });

    return () => {
      console.log('🧹 تنظيف قناة الأخبار');
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  // تبديل الأخبار تلقائياً مع تأثير التلاشي
  useEffect(() => {
    if (newsItems.length <= 1) return;

    const interval = setInterval(() => {
      setFade(false);
      
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % newsItems.length);
        setFade(true);
      }, 300);
      
    }, 4000);

    return () => clearInterval(interval);
  }, [newsItems.length]);

  // إعادة تعيين تأثير التلاشي عند تغيير الأخبار
  useEffect(() => {
    setFade(true);
  }, [currentIndex]);

  // إذا لم توجد أخبار نشطة، اخفاء الشريط تماماً
  if (!newsItems.length) {
    console.log('📭 لا توجد أخبار نشطة للعرض - إخفاء الشريط');
    return null;
  }

  const currentNews = newsItems[currentIndex];
  if (!currentNews) {
    console.log('📭 لا يوجد خبر حالي للعرض');
    return null;
  }

  // تجهيز نص الخبر
  const newsText = currentNews.content 
    ? `${currentNews.title} - ${currentNews.content}` 
    : currentNews.title;

  console.log('📺 عرض الخبر:', currentNews.title, 'نشط:', currentNews.is_active);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="bg-blue-600 text-white px-8 py-4 w-full">
        <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
          <div className="flex-shrink-0 bg-white text-blue-600 px-3 py-1 rounded-md text-sm font-bold">
            أخبار
          </div>
          <div 
            className={`text-lg font-semibold text-center transition-opacity duration-300 ${
              fade ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {newsText}
          </div>
        </div>
        
        {/* مؤشر الأخبار المتعددة */}
        {newsItems.length > 1 && (
          <div className="flex justify-center mt-3 space-x-1 rtl:space-x-reverse">
            {newsItems.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsTickerDisplay;
