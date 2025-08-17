import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NewsItem {
  id: string;
  title: string;
  content: string | null;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
  background_color?: string;
  text_color?: string;
}

interface NewsTickerDisplayProps {
  accountId: string;
}

const NewsTickerDisplay: React.FC<NewsTickerDisplayProps> = ({ accountId }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const mountedRef = useRef(true);
  const lastDataRef = useRef<string>('');

  const fetchNews = async () => {
    if (!accountId || !mountedRef.current) return;


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

      if (!mountedRef.current) return;

      const activeNews = data || [];
      
      // منع التحديثات المتكررة للبيانات المتطابقة
      const dataSignature = JSON.stringify(activeNews);
      if (lastDataRef.current === dataSignature) {
        console.log('✅ [NewsTickerDisplay] البيانات متطابقة، تخطي التحديث');
        return;
      }
      
      lastDataRef.current = dataSignature;
      console.log('✅ [NewsTickerDisplay] الأخبار النشطة المحملة:', activeNews.length);
      
      setNewsItems(activeNews);
      
      // إعادة تعيين الفهرس إذا كانت هناك أخبار جديدة
      if (activeNews.length > 0) {
        setCurrentIndex(0);
        setFade(true);
      }
      
    } catch (error) {
      console.error('❌ [NewsTickerDisplay] خطأ في fetchNews:', error);
    }
  };

  // تحميل أولي للأخبار
  useEffect(() => {
    mountedRef.current = true;
    fetchNews();
    
    return () => {
      mountedRef.current = false;
    };
  }, [accountId]);

  // الاشتراك في التحديثات المباشرة
  useEffect(() => {
    if (!accountId || !mountedRef.current) return;

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
          if (mountedRef.current) {
            console.log('📰 [NewsTickerDisplay] تحديث مباشر للأخبار:', payload);
            // تحديث فوري بدون تأخير
            setTimeout(() => {
              if (mountedRef.current) {
                fetchNews();
              }
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  // تبديل الأخبار تلقائياً - 10 ثوان
  useEffect(() => {
    if (!mountedRef.current || newsItems.length <= 1) return;

    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      
      setFade(false);
      
      setTimeout(() => {
        if (mountedRef.current) {
          setCurrentIndex(prev => (prev + 1) % newsItems.length);
          setFade(true);
        }
      }, 300);
    }, 10000);

    return () => clearInterval(interval);
  }, [newsItems.length]);

  // تحديث فوري عند تغيير newsItems
  useEffect(() => {
    if (newsItems.length > 0) {
      setCurrentIndex(0);
      setFade(true);
    }
  }, [newsItems]);

  // عدم عرض أي شيء إذا لم توجد أخبار نشطة أو المكون غير mounted
  if (!mountedRef.current || !newsItems.length) {
    return null;
  }

  const currentNews = newsItems[currentIndex];
  
  if (!currentNews) {
    return null;
  }

  const newsText = currentNews.content 
    ? `${currentNews.title} - ${currentNews.content}` 
    : currentNews.title;

  const backgroundColor = currentNews.background_color || '#2563eb';
  const textColor = currentNews.text_color || '#ffffff';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="w-full" style={{ backgroundColor, color: textColor }}>
        {/* شاشات كبيرة - عرض كامل */}
        <div className="hidden md:block px-6 py-1.5">
          <div className="flex items-center justify-center">
            <div 
              className={`text-base font-semibold transition-opacity duration-300 text-center ${
                fade ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="news-ticker-static">
                <span 
                  className="px-2 py-0.5 rounded text-xs font-bold ml-2"
                  style={{ backgroundColor: textColor, color: backgroundColor }}
                >
                  أخبار
                </span>
                {newsText}
              </div>
            </div>
          </div>
          
          {newsItems.length > 1 && (
            <div className="flex justify-center mt-2 space-x-1 rtl:space-x-reverse">
              {newsItems.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300`}
                  style={{
                    backgroundColor: index === currentIndex ? textColor : `${textColor}80`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* شاشات متوسطة وصغيرة - عرض مُحسَّن */}
        <div className="block md:hidden px-3 py-1">
          <div className="flex items-center justify-center">
            <div 
              className={`text-sm font-medium transition-opacity duration-300 text-center ${
                fade ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="news-ticker-static">
                <span 
                  className="px-1.5 py-0.5 rounded text-xs font-bold ml-1"
                  style={{ backgroundColor: textColor, color: backgroundColor }}
                >
                  أخبار
                </span>
                {newsText}
              </div>
            </div>
          </div>
          
          {newsItems.length > 1 && (
            <div className="flex justify-center mt-1.5 space-x-1 rtl:space-x-reverse">
              {newsItems.map((_, index) => (
                <div
                  key={index}
                  className={`w-1 h-1 rounded-full transition-all duration-300`}
                  style={{
                    backgroundColor: index === currentIndex ? textColor : `${textColor}80`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* شاشات صغيرة جداً - عرض مُبسَّط */}
        <div className="block sm:hidden">
          <div className="px-2 py-1">
            <div className="flex items-center justify-center">
              <div 
                className={`text-xs font-medium transition-opacity duration-300 text-center ${
                  fade ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="news-ticker-static">
                  <span 
                    className="px-1 py-0.5 rounded text-xs font-bold ml-1"
                    style={{ backgroundColor: textColor, color: backgroundColor }}
                  >
                    أخبار
                  </span>
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
