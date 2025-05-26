
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
      console.log('🔍 [NewsTickerDisplay] جاري تحميل الأخبار النشطة للعرض:', accountId);
      const { data, error } = await supabase
        .from('news_ticker')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)  // فقط الأخبار النشطة
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ [NewsTickerDisplay] خطأ في تحميل الأخبار:', error);
        return;
      }

      const activeNews = data || [];
      console.log('✅ [NewsTickerDisplay] تم تحميل الأخبار النشطة:', activeNews.length, activeNews);
      
      if (activeNews.length === 0) {
        console.log('📭 [NewsTickerDisplay] لا توجد أخبار نشطة - تعيين قائمة فارغة');
        setNewsItems([]);
        setCurrentIndex(0);
        return;
      }

      console.log('📺 [NewsTickerDisplay] تعيين الأخبار النشطة:', activeNews.map(n => ({ id: n.id, title: n.title, is_active: n.is_active })));
      setNewsItems(activeNews);
      
      // إعادة تعيين الفهرس إذا كان الفهرس الحالي خارج النطاق
      if (activeNews.length <= currentIndex) {
        console.log('🔄 [NewsTickerDisplay] إعادة تعيين الفهرس من', currentIndex, 'إلى 0');
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('❌ [NewsTickerDisplay] خطأ في fetchNews:', error);
    }
  };

  useEffect(() => {
    console.log('🚀 [NewsTickerDisplay] تحميل أولي للأخبار');
    fetchNews();
  }, [accountId]);

  // الاشتراك في التحديثات المباشرة
  useEffect(() => {
    console.log('📡 [NewsTickerDisplay] إعداد قناة التحديثات المباشرة للأخبار');
    
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
          console.log('📰 [NewsTickerDisplay] تحديث فوري في الأخبار:', payload.eventType, payload);
          console.log('📰 [NewsTickerDisplay] البيانات الجديدة:', payload.new);
          console.log('📰 [NewsTickerDisplay] البيانات القديمة:', payload.old);
          
          // إعادة تحميل الأخبار فوراً عند أي تغيير
          console.log('🔄 [NewsTickerDisplay] إعادة تحميل الأخبار بسبب التحديث المباشر');
          fetchNews();
        }
      )
      .subscribe((status) => {
        console.log('📡 [NewsTickerDisplay] حالة قناة الأخبار:', status);
      });

    return () => {
      console.log('🧹 [NewsTickerDisplay] تنظيف قناة الأخبار');
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

  // متابعة تغييرات newsItems
  useEffect(() => {
    console.log('📋 [NewsTickerDisplay] تغيير في قائمة الأخبار:', {
      length: newsItems.length,
      items: newsItems.map(n => ({ id: n.id, title: n.title, is_active: n.is_active }))
    });
  }, [newsItems]);

  // إذا لم توجد أخبار نشطة، اخفاء الشريط تماماً
  if (!newsItems.length) {
    console.log('🚫 [NewsTickerDisplay] لا توجد أخبار نشطة للعرض - إرجاع null');
    return null;
  }

  const currentNews = newsItems[currentIndex];
  if (!currentNews) {
    console.log('🚫 [NewsTickerDisplay] لا يوجد خبر حالي للعرض');
    return null;
  }

  // تجهيز نص الخبر
  const newsText = currentNews.content 
    ? `${currentNews.title} - ${currentNews.content}` 
    : currentNews.title;

  console.log('📺 [NewsTickerDisplay] عرض الخبر:', currentNews.title, 'نشط:', currentNews.is_active);

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
