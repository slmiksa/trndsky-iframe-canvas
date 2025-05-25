
import { useEffect, useRef } from 'react';
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

interface UseRealtimeUpdatesProps {
  account: Account | null;
  subscriptionExpired: boolean;
  setRotationInterval: (interval: number) => void;
  setAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  fetchWebsites: (account: Account) => Promise<any>;
}

export const useRealtimeUpdates = ({
  account,
  subscriptionExpired,
  setRotationInterval,
  setAccount,
  fetchWebsites
}: UseRealtimeUpdatesProps) => {
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced debounced fetch function
  const debouncedFetchWebsites = (accountData: Account) => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔄 تحديث المواقع المحسن (enhanced debounced)');
        await fetchWebsites(accountData);
        console.log('✅ تم تحديث المواقع بنجاح');
      } catch (error) {
        console.error('❌ خطأ في التحديث المحسن:', error);
      }
    }, 500); // Reduced debounce time for faster updates
  };

  // Enhanced connection monitoring and recovery
  const setupConnectionMonitoring = () => {
    // Clear existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Setup heartbeat to monitor connection
    heartbeatIntervalRef.current = setInterval(() => {
      if (!isConnectedRef.current && account?.id) {
        console.log('🔄 إعادة محاولة الاتصال للتحديثات الفورية');
        setupRealtimeListeners();
      }
    }, 15000); // Check every 15 seconds
  };

  // Enhanced realtime listener setup
  const setupRealtimeListeners = () => {
    if (!account?.id || subscriptionExpired) {
      console.log('⏭️ تخطي إعداد التحديثات الفورية');
      return;
    }

    console.log('🌐 إعداد مستمعات التحديث المحسنة');
    
    // Account changes listener
    const accountChannelName = `account-enhanced-${account.id}-${Date.now()}`;
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
          console.log('🔄 تغيير محسن في بيانات الحساب:', payload);
          
          if (payload.new?.rotation_interval !== undefined) {
            console.log('⏱️ تحديث فترة التبديل المحسن:', payload.new.rotation_interval);
            setRotationInterval(payload.new.rotation_interval);
            setAccount(prev => prev ? { ...prev, rotation_interval: payload.new.rotation_interval } : null);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة اشتراك الحساب المحسن:', status);
        isConnectedRef.current = status === 'SUBSCRIBED';
      });

    // Websites changes listener with enhanced reliability
    const websiteChannelName = `websites-enhanced-${account.id}-${Date.now()}`;
    const websiteChannel = supabase
      .channel(websiteChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_websites',
          filter: `account_id=eq.${account.id}`
        },
        async (payload) => {
          console.log('🚀 تحديث محسن للموقع:', payload);
          console.log('📅 الوقت:', new Date().toISOString());
          console.log('🎯 نوع الحدث:', payload.eventType);
          console.log('🖥️ نوع الجهاز:', navigator.userAgent.includes('Mobile') ? 'جوال' : 'كمبيوتر');
          
          // Force immediate update for desktop browsers
          debouncedFetchWebsites(account);
          
          // Additional force refresh for desktop after short delay
          if (!navigator.userAgent.includes('Mobile')) {
            setTimeout(() => {
              console.log('🖥️ تحديث إضافي للكمبيوتر');
              debouncedFetchWebsites(account);
            }, 1000);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة اشتراك المواقع المحسن:', status);
        isConnectedRef.current = status === 'SUBSCRIBED';
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ تم الاشتراك بنجاح في التحديثات المحسنة!');
          // Clear any retry attempts
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ خطأ في الاشتراك - محاولة إعادة الاتصال');
          isConnectedRef.current = false;
          
          // Retry connection after delay
          retryTimeoutRef.current = setTimeout(() => {
            console.log('🔄 إعادة محاولة الاتصال');
            setupRealtimeListeners();
          }, 5000);
        }
      });

    return () => {
      console.log('🧹 تنظيف مستمعات التحديث المحسنة');
      supabase.removeChannel(accountChannel);
      supabase.removeChannel(websiteChannel);
      isConnectedRef.current = false;
    };
  };

  // Setup realtime listeners for account changes
  useEffect(() => {
    const cleanup = setupRealtimeListeners();
    setupConnectionMonitoring();

    return () => {
      if (cleanup) cleanup();
      
      // Clear all timeouts and intervals
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [account?.id, subscriptionExpired, setRotationInterval, setAccount, fetchWebsites]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);
};
