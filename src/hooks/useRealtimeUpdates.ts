
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

interface UseRealtimeUpdatesProps {
  account: Account | null;
  subscriptionExpired: boolean;
  setRotationInterval: (interval: number) => void;
  setAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  fetchWebsites: (account: Account, forceRefresh?: boolean) => Promise<any>;
}

export const useRealtimeUpdates = ({
  account,
  subscriptionExpired,
  setRotationInterval,
  setAccount,
  fetchWebsites
}: UseRealtimeUpdatesProps) => {
  // Enhanced stability refs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const channelsRef = useRef<any[]>([]);
  const mountedRef = useRef(true);
  const isProcessingUpdate = useRef(false);

  // Super stable debounced fetch with longer delays
  const debouncedFetchWebsites = useCallback((accountData: Account, reason = 'update') => {
    if (!mountedRef.current || !accountData || isProcessingUpdate.current) return;

    const now = Date.now();
    
    // Much stronger debouncing - minimum 5 seconds between updates
    if (now - lastUpdateTime.current < 5000) {
      console.log('⏭️ تخطي التحديث - منع الوميض:', reason);
      return;
    }

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Longer debounce delay to prevent flickering
    debounceTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current || isProcessingUpdate.current) return;
      
      try {
        isProcessingUpdate.current = true;
        console.log('🔄 تحديث مستقر بدون وميض:', { reason, accountId: accountData.id });
        lastUpdateTime.current = Date.now();
        await fetchWebsites(accountData, true);
        console.log('✅ تم التحديث بنجاح بدون وميض');
      } catch (error) {
        console.error('❌ خطأ في التحديث المستقر:', error);
      } finally {
        isProcessingUpdate.current = false;
      }
    }, 3000); // Increased to 3 seconds delay
  }, [fetchWebsites]);

  // Enhanced cleanup
  const cleanupChannels = useCallback(() => {
    console.log('🧹 تنظيف جميع الاتصالات');
    
    channelsRef.current.forEach(channel => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('❌ خطأ في إزالة القناة:', error);
      }
    });
    
    channelsRef.current = [];
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    isProcessingUpdate.current = false;
  }, []);

  // Enhanced realtime setup with better stability
  const setupRealtimeListeners = useCallback(() => {
    if (!account?.id || subscriptionExpired || !mountedRef.current) {
      console.log('⏭️ تخطي إعداد التحديثات الفورية:', {
        hasAccount: !!account?.id,
        expired: subscriptionExpired,
        mounted: mountedRef.current
      });
      return;
    }

    // Clean up first
    cleanupChannels();

    console.log('🌐 إعداد مستمعات مستقرة للحساب:', account.id);
    
    try {
      // Account changes with minimal updates
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
            if (!mountedRef.current) return;
            
            console.log('🔄 تحديث بيانات الحساب المستقر:', payload.new);
            
            const newData = payload.new as any;
            if (newData?.rotation_interval !== undefined) {
              console.log('⏱️ تحديث فترة التبديل:', newData.rotation_interval);
              setRotationInterval(newData.rotation_interval);
              setAccount(prev => prev ? { ...prev, rotation_interval: newData.rotation_interval } : null);
            }
          }
        )
        .subscribe();

      // Website changes with heavy stability measures
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
          (payload) => {
            if (!mountedRef.current || isProcessingUpdate.current) return;
            
            console.log('🚀 تحديث موقع مستقر:', {
              event: payload.eventType,
              timestamp: new Date().toISOString()
            });
            
            // Super stable debounced update
            debouncedFetchWebsites(account, `realtime-${payload.eventType}`);
          }
        )
        .subscribe((status) => {
          console.log('📡 حالة اشتراك المواقع المستقر:', status);
        });

      // Store channels
      channelsRef.current = [accountChannel, websiteChannel];

    } catch (error) {
      console.error('❌ خطأ في إعداد المستمعات المستقرة:', error);
    }
  }, [account, subscriptionExpired, debouncedFetchWebsites, setRotationInterval, setAccount, cleanupChannels]);

  // Setup with account changes
  useEffect(() => {
    setupRealtimeListeners();
    
    return () => {
      cleanupChannels();
    };
  }, [setupRealtimeListeners, cleanupChannels]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      isProcessingUpdate.current = false;
      cleanupChannels();
    };
  }, [cleanupChannels]);
};
