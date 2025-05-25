
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Account {
  id: string;
  name: string;
  email: string;
  database_name: string;
  status: 'active' | 'suspended' | 'pending';
  activation_start_date: string | null;
  activation_end_date: string | null;
  is_subscription_active: boolean | null;
  rotation_interval: number;
}

interface Website {
  id: string;
  website_url: string;
  website_title: string | null;
  iframe_content: string | null;
  is_active: boolean;
}

interface UseVisitorRealtimeUpdatesProps {
  account: Account | null;
  fetchWebsites: (account: Account, forceRefresh?: boolean) => Promise<Website[]>;
  setRotationInterval: (interval: number) => void;
  setAccount: React.Dispatch<React.SetStateAction<Account | null>>;
}

export const useVisitorRealtimeUpdates = ({
  account,
  fetchWebsites,
  setRotationInterval,
  setAccount
}: UseVisitorRealtimeUpdatesProps) => {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const channelsRef = useRef<any[]>([]);
  const mountedRef = useRef(true);
  const isProcessingUpdate = useRef(false);

  console.log('🌐 إعداد التحديثات الفورية للزائر');

  // دالة تحديث مستقرة مع منع التكرار السريع
  const debouncedFetchWebsites = useCallback((accountData: Account, reason = 'visitor-update') => {
    if (!mountedRef.current || !accountData || isProcessingUpdate.current) return;

    const now = Date.now();
    
    // منع التحديثات السريعة - 2 ثانية كحد أدنى للزوار
    if (now - lastUpdateTime.current < 2000) {
      console.log('⏭️ منع التحديث السريع للزائر:', reason);
      return;
    }

    // مسح أي timeout موجود
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // تأخير قصير للزوار لضمان الاستقرار
    debounceTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current || isProcessingUpdate.current) return;
      
      try {
        isProcessingUpdate.current = true;
        console.log('🔄 تحديث فوري للزائر:', { reason, accountId: accountData.id });
        lastUpdateTime.current = Date.now();
        await fetchWebsites(accountData, true);
        console.log('✅ تم التحديث الفوري للزائر بنجاح');
      } catch (error) {
        console.error('❌ خطأ في التحديث الفوري للزائر:', error);
      } finally {
        isProcessingUpdate.current = false;
      }
    }, 1000); // ثانية واحدة للزوار
  }, [fetchWebsites]);

  // تنظيف القنوات
  const cleanupChannels = useCallback(() => {
    console.log('🧹 تنظيف قنوات الزائر');
    
    channelsRef.current.forEach(channel => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('❌ خطأ في إزالة قناة الزائر:', error);
      }
    });
    
    channelsRef.current = [];
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    isProcessingUpdate.current = false;
  }, []);

  // إعداد مستمعات التحديثات الفورية للزائر
  const setupVisitorRealtimeListeners = useCallback(() => {
    if (!account?.id || !mountedRef.current) {
      console.log('⏭️ تخطي إعداد التحديثات الفورية للزائر:', {
        hasAccount: !!account?.id,
        mounted: mountedRef.current
      });
      return;
    }

    // تنظيف أولاً
    cleanupChannels();

    console.log('🌐 إعداد مستمعات فورية للزائر:', account.id);
    
    try {
      // مراقبة تغييرات الحساب (فترة التبديل)
      const accountChannelName = `visitor-account-${account.id}`;
      const accountChannel = supabase
        .channel(accountChannelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'accounts',
            filter: `id=eq.${account.id}`
          },
          (payload) => {
            if (!mountedRef.current) return;
            
            console.log('🔄 تحديث بيانات الحساب للزائر:', payload.new);
            
            const newData = payload.new as any;
            if (newData?.rotation_interval !== undefined) {
              console.log('⏱️ تحديث فترة التبديل للزائر:', newData.rotation_interval);
              setRotationInterval(newData.rotation_interval);
              setAccount(prev => prev ? { ...prev, rotation_interval: newData.rotation_interval } : null);
            }
          }
        )
        .subscribe();

      // مراقبة تغييرات المواقع - الأهم للزائر
      const websiteChannelName = `visitor-websites-${account.id}`;
      const websiteChannel = supabase
        .channel(websiteChannelName)
        .on(
          'postgres_changes',
          {
            event: '*', // جميع الأحداث: INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'account_websites',
            filter: `account_id=eq.${account.id}`
          },
          (payload) => {
            if (!mountedRef.current || isProcessingUpdate.current) return;
            
            // إضافة فحوصات للتأكد من وجود البيانات
            const websiteId = (payload.new as any)?.id || (payload.old as any)?.id || 'unknown';
            const isActive = (payload.new as any)?.is_active;
            
            console.log('🚀 تحديث موقع فوري للزائر:', {
              event: payload.eventType,
              websiteId: websiteId,
              active: isActive,
              timestamp: new Date().toISOString()
            });
            
            // تحديث فوري للزائر
            debouncedFetchWebsites(account, `visitor-${payload.eventType}`);
          }
        )
        .subscribe((status) => {
          console.log('📡 حالة اشتراك المواقع للزائر:', status);
        });

      // حفظ القنوات
      channelsRef.current = [accountChannel, websiteChannel];

    } catch (error) {
      console.error('❌ خطأ في إعداد مستمعات الزائر:', error);
    }
  }, [account, debouncedFetchWebsites, setRotationInterval, setAccount, cleanupChannels]);

  // إعداد المستمعات عند تغيير الحساب
  useEffect(() => {
    setupVisitorRealtimeListeners();
    
    return () => {
      cleanupChannels();
    };
  }, [setupVisitorRealtimeListeners, cleanupChannels]);

  // تنظيف عند الإلغاء
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      isProcessingUpdate.current = false;
      cleanupChannels();
    };
  }, [cleanupChannels]);
};
