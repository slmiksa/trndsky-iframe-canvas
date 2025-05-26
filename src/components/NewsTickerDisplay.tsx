
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
      console.log('🔍 [NewsTickerDisplay] تحميل الأخبار النشطة للحساب:', accountId);
      const { data, error } = await supabase
        .from('news_ticker')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ [NewsTickerDisplay] خطأ في تحميل الأخبار:', error);
        return;
      }

      const activeNews = data || [];
      console.log('✅ [NewsTickerDisplay] الأخبار النشطة المحملة:', activeNews.length, activeNews);
      
      setNewsItems(activeNews);
      
      if (activeNews.length === 0) {
        console.log('📭 [NewsTickerDisplay] لا توجد أخبار نشطة - إخفاء الشريط');
        setCurrentIndex(0);
      } else if (currentIndex >= activeNews.length) {
        console.log('🔄 [NewsTickerDisplay] إعادة تعيين الفهرس إلى 0');
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('❌ [NewsTickerDisplay] خطأ في fetchNews:', error);
    }
  };

  // تحميل أولي للأخبار
  useEffect(() => {
    console.log('🚀 [NewsTickerDisplay] بدء التحميل الأولي للأخبار');
    fetchNews();
  }, [accountId]);

  // الاشتراك في التحديثات المباشرة مع إعادة تحميل فورية
  useEffect(() => {
    if (!accountId) return;

    console.log('📡 [NewsTickerDisplay] إعداد قناة التحديثات المباشرة');
    
    const channel = supabase
      .channel(`news_ticker_display_${accountId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_ticker',
          filter: `account_id=eq.${accountId}`
        },
        (payload) => {
          console.log('📰 [NewsTickerDisplay] تحديث مباشر للأخبار:', {
            event: payload.eventType,
            new: payload.new,
            old: payload.old
          });
          
          // إعادة تحميل فورية عند أي تغيير
          setTimeout(() => {
            console.log('🔄 [NewsTickerDisplay] إعادة تحميل الأخبار بعد التحديث');
            fetchNews();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('📡 [NewsTickerDisplay] حالة الاشتراك:', status);
      });

    // تحديث دوري كل 3 ثوان للتأكد
    const interval = setInterval(() => {
      console.log('⏰ [NewsTickerDisplay] تحديث دوري للأخبار');
      fetchNews();
    }, 3000);

    return () => {
      console.log('🧹 [NewsTickerDisplay] تنظيف الموارد');
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  // تبديل الأخبار تلقائياً
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

  // إعادة تعيين تأثير التلاشي
  useEffect(() => {
    setFade(true);
  }, [currentIndex]);

  // عدم عرض أي شيء إذا لم توجد أخبار نشطة
  if (!newsItems.length) {
    console.log('🚫 [NewsTickerDisplay] لا توجد أخبار نشطة - إرجاع null');
    return null;
  }

  const currentNews = newsItems[currentIndex];
  if (!currentNews) {
    console.log('🚫 [NewsTickerDisplay] لا يوجد خبر حالي');
    return null;
  }

  const newsText = currentNews.content 
    ? `${currentNews.title} - ${currentNews.content}` 
    : currentNews.title;

  console.log('📺 [NewsTickerDisplay] عرض الخبر:', {
    title: currentNews.title,
    index: currentIndex,
    total: newsItems.length
  });

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
