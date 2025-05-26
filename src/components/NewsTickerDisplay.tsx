
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
      setNewsItems(data || []);
      
      // إعادة تعيين الفهرس إذا لم تعد هناك أخبار أو إذا كان الفهرس الحالي خارج النطاق
      if (!data || data.length === 0) {
        setCurrentIndex(0);
      } else if (data.length <= currentIndex) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('❌ خطأ في fetchNews:', error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [accountId]);

  // الاشتراك في التحديثات المباشرة مع استجابة فورية
  useEffect(() => {
    console.log('📡 إعداد قناة التحديثات المباشرة للأخبار');
    
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
          console.log('📰 تحديث فوري في الأخبار:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as NewsItem;
            if (newItem.is_active) {
              console.log('➕ إضافة خبر جديد:', newItem.title);
              setNewsItems(prev => {
                const updated = [...prev, newItem].sort((a, b) => 
                  (a.display_order || 0) - (b.display_order || 0)
                );
                return updated;
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as NewsItem;
            console.log('🔄 تحديث خبر:', updatedItem.title, 'نشط:', updatedItem.is_active);
            
            setNewsItems(prev => {
              if (updatedItem.is_active) {
                // إضافة أو تحديث الخبر النشط
                const existingIndex = prev.findIndex(item => item.id === updatedItem.id);
                if (existingIndex >= 0) {
                  // تحديث الخبر الموجود
                  const updated = prev.map(item => 
                    item.id === updatedItem.id ? updatedItem : item
                  ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                  return updated;
                } else {
                  // إضافة خبر جديد
                  const updated = [...prev, updatedItem].sort((a, b) => 
                    (a.display_order || 0) - (b.display_order || 0)
                  );
                  return updated;
                }
              } else {
                // إزالة الخبر فوراً عند إيقاف تنشيطه
                console.log('🚫 إزالة الخبر غير النشط فوراً:', updatedItem.title);
                const filtered = prev.filter(item => item.id !== updatedItem.id);
                
                // إذا كان الخبر المحذوف هو الخبر الحالي، انتقل للتالي
                setCurrentIndex(prevIndex => {
                  if (filtered.length === 0) return 0;
                  if (prevIndex >= filtered.length) return 0;
                  return prevIndex;
                });
                
                return filtered;
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedItem = payload.old as NewsItem;
            console.log('🗑️ حذف خبر:', deletedItem.title);
            setNewsItems(prev => {
              const filtered = prev.filter(item => item.id !== deletedItem.id);
              
              // إذا كان الخبر المحذوف هو الخبر الحالي، انتقل للتالي
              setCurrentIndex(prevIndex => {
                if (filtered.length === 0) return 0;
                if (prevIndex >= filtered.length) return 0;
                return prevIndex;
              });
              
              return filtered;
            });
          }
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
      }, 300); // انتظار انتهاء تأثير التلاشي
      
    }, 4000); // تغيير كل 4 ثوان

    return () => clearInterval(interval);
  }, [newsItems.length]);

  // إعادة تعيين تأثير التلاشي عند تغيير الأخبار
  useEffect(() => {
    setFade(true);
  }, [currentIndex]);

  // إذا لم توجد أخبار نشطة، لا تظهر أي شيء
  if (!newsItems.length) {
    console.log('📭 لا توجد أخبار نشطة للعرض');
    return null;
  }

  const currentNews = newsItems[currentIndex];
  if (!currentNews) return null;

  // تجهيز نص الخبر
  const newsText = currentNews.content 
    ? `${currentNews.title} - ${currentNews.content}` 
    : currentNews.title;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
      <div className="bg-blue-600 text-white px-8 py-4 rounded-lg shadow-2xl max-w-4xl mx-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
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
