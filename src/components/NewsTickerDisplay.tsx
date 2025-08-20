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
      .channel(`news_ticker_realtime_${accountId}_${Date.now()}`)
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
            console.log('📰 [NewsTickerDisplay] تحديث مباشر فوري:', payload);
            
            // معالجة التحديثات المختلفة
            if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedItem = payload.new as NewsItem;
              console.log('🔄 [NewsTickerDisplay] عنصر محدث:', updatedItem.id, 'نشط:', updatedItem.is_active);
              
              setNewsItems(prevItems => {
                // إضافة أو تحديث العنصر
                const itemExists = prevItems.find(item => item.id === updatedItem.id);
                let updatedItems;
                
                if (itemExists) {
                  // تحديث العنصر الموجود
                  updatedItems = prevItems.map(item => 
                    item.id === updatedItem.id ? updatedItem : item
                  );
                } else if (updatedItem.is_active) {
                  // إضافة عنصر جديد نشط
                  updatedItems = [...prevItems, updatedItem];
                } else {
                  // العنصر غير موجود وغير نشط
                  updatedItems = prevItems;
                }
                
                // تصفية الأخبار النشطة فقط
                const activeItems = updatedItems.filter(item => item.is_active);
                console.log('✅ [NewsTickerDisplay] تحديث فوري للقائمة - عدد الأخبار النشطة:', activeItems.length);
                
                return activeItems;
              });
              
              // إعادة تعيين الفهرس
              setCurrentIndex(0);
              setFade(true);
            }
            else if (payload.eventType === 'INSERT' && payload.new) {
              const newItem = payload.new as NewsItem;
              console.log('➕ [NewsTickerDisplay] خبر جديد:', newItem.id, 'نشط:', newItem.is_active);
              
              if (newItem.is_active) {
                setNewsItems(prevItems => {
                  const activeItems = [...prevItems, newItem].filter(item => item.is_active);
                  console.log('✅ [NewsTickerDisplay] إضافة خبر جديد - عدد الأخبار النشطة:', activeItems.length);
                  return activeItems;
                });
                setCurrentIndex(0);
                setFade(true);
              }
            }
            else if (payload.eventType === 'DELETE' && payload.old) {
              const deletedItem = payload.old as NewsItem;
              console.log('🗑️ [NewsTickerDisplay] حذف خبر:', deletedItem.id);
              
              setNewsItems(prevItems => {
                const filteredItems = prevItems.filter(item => item.id !== deletedItem.id);
                console.log('✅ [NewsTickerDisplay] حذف خبر - عدد الأخبار المتبقية:', filteredItems.length);
                return filteredItems;
              });
              setCurrentIndex(0);
              setFade(true);
            }
            
            // تحديث شامل بعد تأخير قصير للتأكد من التزامن
            setTimeout(() => {
              if (mountedRef.current) {
                fetchNews();
              }
            }, 200);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [NewsTickerDisplay] حالة الاشتراك:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [NewsTickerDisplay] اشتراك ناجح في التحديثات المباشرة');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [NewsTickerDisplay] خطأ في الاشتراك');
        }
      });

    return () => {
      console.log('🔌 [NewsTickerDisplay] إغلاق الاشتراك');
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
