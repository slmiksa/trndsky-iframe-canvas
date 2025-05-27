
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
      
      setNewsItems(prevNews => {
        if (JSON.stringify(prevNews) !== JSON.stringify(activeNews)) {
          console.log('🔄 [NewsTickerDisplay] تغيير في الأخبار - إعادة ضبط الفهرس');
          
          if (activeNews.length === 0) {
            console.log('📭 [NewsTickerDisplay] لا توجد أخبار نشطة');
            setCurrentIndex(0);
            return activeNews;
          }
          
          setCurrentIndex(prev => {
            const newIndex = prev >= activeNews.length ? 0 : prev;
            console.log('📍 [NewsTickerDisplay] تحديث الفهرس من', prev, 'إلى', newIndex);
            return newIndex;
          });
        }
        
        return activeNews;
      });
      
    } catch (error) {
      console.error('❌ [NewsTickerDisplay] خطأ في fetchNews:', error);
    }
  };

  // تحميل أولي للأخبار
  useEffect(() => {
    console.log('🚀 [NewsTickerDisplay] بدء التحميل الأولي للأخبار');
    fetchNews();
  }, [accountId]);

  // الاشتراك في التحديثات المباشرة
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

  // تبديل الأخبار تلقائياً مع التحقق من صحة الفهرس
  useEffect(() => {
    if (newsItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= newsItems.length) {
          console.log('⚠️ [NewsTickerDisplay] فهرس غير صحيح، إعادة تعيين إلى 0');
          setFade(true);
          return 0;
        }
        
        setFade(false);
        
        setTimeout(() => {
          setFade(true);
        }, 300);
        
        const nextIndex = (prev + 1) % newsItems.length;
        console.log('🔄 [NewsTickerDisplay] الانتقال من الفهرس', prev, 'إلى', nextIndex);
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [newsItems.length]);

  // إعادة تعيين تأثير التلاشي مع التحقق من صحة الفهرس
  useEffect(() => {
    if (currentIndex < newsItems.length) {
      setFade(true);
    } else if (newsItems.length > 0) {
      console.log('🔧 [NewsTickerDisplay] إصلاح فهرس خارج النطاق');
      setCurrentIndex(0);
    }
  }, [currentIndex, newsItems.length]);

  // عدم عرض أي شيء إذا لم توجد أخبار نشطة
  if (!newsItems.length) {
    console.log('🚫 [NewsTickerDisplay] لا توجد أخبار نشطة - إرجاع null');
    return null;
  }

  // التحقق من صحة الفهرس الحالي
  const safeCurrentIndex = currentIndex >= newsItems.length ? 0 : currentIndex;
  const currentNews = newsItems[safeCurrentIndex];
  
  if (!currentNews) {
    console.log('🚫 [NewsTickerDisplay] لا يوجد خبر حالي للفهرس', safeCurrentIndex);
    return null;
  }

  // تحديث الفهرس إذا كان غير صحيح
  if (safeCurrentIndex !== currentIndex) {
    console.log('🔧 [NewsTickerDisplay] تصحيح الفهرس من', currentIndex, 'إلى', safeCurrentIndex);
    setCurrentIndex(safeCurrentIndex);
  }

  const newsText = currentNews.content 
    ? `${currentNews.title} - ${currentNews.content}` 
    : currentNews.title;

  console.log('📺 [NewsTickerDisplay] عرض الخبر:', {
    title: currentNews.title,
    index: safeCurrentIndex,
    total: newsItems.length,
    actualCurrentIndex: currentIndex
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="bg-blue-600 text-white w-full">
        {/* شاشات كبيرة - عرض كامل */}
        <div className="hidden md:block px-8 py-4">
          <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
            <div className="flex-shrink-0 bg-white text-blue-600 px-3 py-1 rounded-md text-sm font-bold">
              أخبار
            </div>
            <div 
              className={`text-lg font-semibold transition-opacity duration-300 flex-1 ${
                fade ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="news-ticker-static">
                {newsText}
              </div>
            </div>
          </div>
          
          {newsItems.length > 1 && (
            <div className="flex justify-center mt-3 space-x-1 rtl:space-x-reverse">
              {newsItems.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === safeCurrentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* شاشات متوسطة وصغيرة - عرض مُحسَّن */}
        <div className="block md:hidden px-4 py-3">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="flex-shrink-0 bg-white text-blue-600 px-2 py-1 rounded text-xs font-bold">
              أخبار
            </div>
            <div 
              className={`text-sm font-medium transition-opacity duration-300 flex-1 ${
                fade ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="news-ticker-static">
                {newsText}
              </div>
            </div>
          </div>
          
          {newsItems.length > 1 && (
            <div className="flex justify-center mt-2 space-x-1 rtl:space-x-reverse">
              {newsItems.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === safeCurrentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* شاشات صغيرة جداً - عرض مُبسَّط */}
        <div className="block sm:hidden">
          <div className="px-3 py-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="flex-shrink-0 bg-white text-blue-600 px-1.5 py-0.5 rounded text-xs font-bold">
                أخبار
              </div>
              <div 
                className={`text-xs font-medium transition-opacity duration-300 flex-1 ${
                  fade ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="news-ticker-static">
                  {currentNews.title}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTickerDisplay;
