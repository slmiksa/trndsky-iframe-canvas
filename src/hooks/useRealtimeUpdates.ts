
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
  const lastUpdateTime = useRef<number>(0);

  // Enhanced debounced fetch function with stronger debouncing
  const debouncedFetchWebsites = (accountData: Account) => {
    const now = Date.now();
    
    // Stronger debouncing for stability - minimum 3 seconds between updates
    if (now - lastUpdateTime.current < 3000) {
      console.log('⏭️ تخطي التحديث - فترة الانتظار لم تنته');
      return;
    }

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔄 تحديث المواقع مع استقرار محسن');
        lastUpdateTime.current = Date.now();
        await fetchWebsites(accountData);
        console.log('✅ تم تحديث المواقع بنجاح مع الاستقرار');
      } catch (error) {
        console.error('❌ خطأ في التحديث المستقر:', error);
      }
    }, 1500); // Increased delay for more stability
  };

  // Enhanced realtime listener setup with better stability
  const setupRealtimeListeners = () => {
    if (!account?.id || subscriptionExpired) {
      console.log('⏭️ تخطي إعداد التحديثات الفورية');
      return;
    }

    console.log('🌐 إعداد مستمعات التحديث المستقرة');
    
    // Account changes listener
    const accountChannelName = `account-stable-${account.id}`;
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
          console.log('🔄 تغيير مستقر في بيانات الحساب:', payload);
          
          if (payload.new?.rotation_interval !== undefined) {
            console.log('⏱️ تحديث فترة التبديل المستقر:', payload.new.rotation_interval);
            setRotationInterval(payload.new.rotation_interval);
            setAccount(prev => prev ? { ...prev, rotation_interval: payload.new.rotation_interval } : null);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة اشتراك الحساب المستقر:', status);
        isConnectedRef.current = status === 'SUBSCRIBED';
      });

    // Websites changes listener with enhanced stability
    const websiteChannelName = `websites-stable-${account.id}`;
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
          console.log('🚀 تحديث مستقر للموقع:', payload);
          console.log('📅 الوقت:', new Date().toISOString());
          console.log('🎯 نوع الحدث:', payload.eventType);
          
          // Enhanced debounced update for maximum stability
          debouncedFetchWebsites(account);
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة اشتراك المواقع المستقر:', status);
        isConnectedRef.current = status === 'SUBSCRIBED';
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ تم الاشتراك بنجاح في التحديثات المستقرة!');
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
            console.log('🔄 إعادة محاولة الاتصال المستقر');
            setupRealtimeListeners();
          }, 10000); // Increased retry delay
        }
      });

    return () => {
      console.log('🧹 تنظيف مستمعات التحديث المستقرة');
      supabase.removeChannel(accountChannel);
      supabase.removeChannel(websiteChannel);
      isConnectedRef.current = false;
    };
  };

  // Setup realtime listeners for account changes
  useEffect(() => {
    const cleanup = setupRealtimeListeners();

    return () => {
      if (cleanup) cleanup();
      
      // Clear all timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
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
    };
  }, []);
};
