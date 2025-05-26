
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
    } catch (error) {
      console.error('❌ خطأ في fetchNews:', error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [accountId]);

  // الاشتراك في التحديثات المباشرة مع معالجة فورية للتحديثات
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
          console.log('📰 تحديث في الأخبار:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as NewsItem;
            if (newItem.is_active) {
              setNewsItems(prev => [...prev, newItem].sort((a, b) => 
                (a.display_order || 0) - (b.display_order || 0)
              ));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as NewsItem;
            setNewsItems(prev => {
              if (updatedItem.is_active) {
                // إضافة أو تحديث الخبر النشط
                const exists = prev.find(item => item.id === updatedItem.id);
                if (exists) {
                  return prev.map(item => 
                    item.id === updatedItem.id ? updatedItem : item
                  ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                } else {
                  return [...prev, updatedItem].sort((a, b) => 
                    (a.display_order || 0) - (b.display_order || 0)
                  );
                }
              } else {
                // إزالة الخبر فوراً عند إيقاف تنشيطه
                console.log('🚫 إزالة الخبر غير النشط:', updatedItem.title);
                return prev.filter(item => item.id !== updatedItem.id);
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedItem = payload.old as NewsItem;
            setNewsItems(prev => prev.filter(item => item.id !== deletedItem.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  if (!newsItems.length) {
    return null;
  }

  // دمج جميع الأخبار في نص واحد مع فاصل
  const combinedNewsText = newsItems.map(item => {
    const newsText = item.content 
      ? `${item.title} - ${item.content}` 
      : item.title;
    return newsText;
  }).join(' • ');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white z-40">
      <div className="flex items-center px-4 py-2">
        <div className="flex-shrink-0 bg-white text-blue-600 px-3 py-1 rounded-md text-sm font-bold ml-4">
          أخبار
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee-continuous whitespace-nowrap">
            <span className="font-semibold">
              {combinedNewsText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTickerDisplay;
