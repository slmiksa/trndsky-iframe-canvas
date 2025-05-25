
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
  // Refs for managing state and preventing memory leaks
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const isConnectedRef = useRef(false);
  const channelsRef = useRef<any[]>([]);
  const mountedRef = useRef(true);

  // Enhanced debounced fetch with better stability
  const debouncedFetchWebsites = useCallback((accountData: Account, reason = 'update') => {
    if (!mountedRef.current || !accountData) return;

    const now = Date.now();
    
    // Strong debouncing - minimum 3 seconds between updates
    if (now - lastUpdateTime.current < 3000) {
      console.log('⏭️ تخطي التحديث المكرر - منع التحديث السريع:', reason);
      return;
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      
      try {
        console.log('🔄 تحديث مستقر للمواقع:', { reason, accountId: accountData.id });
        lastUpdateTime.current = Date.now();
        await fetchWebsites(accountData, true);
        console.log('✅ تم تحديث المواقع بنجاح');
      } catch (error) {
        console.error('❌ خطأ في التحديث المستقر:', error);
      }
    }, 2000);
  }, [fetchWebsites]);

  // Enhanced connection cleanup
  const cleanupChannels = useCallback(() => {
    console.log('🧹 تنظيف الاتصالات المفتوحة');
    
    channelsRef.current.forEach(channel => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('❌ خطأ في إزالة القناة:', error);
      }
    });
    
    channelsRef.current = [];
    isConnectedRef.current = false;
    
    // Clear timeouts
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Enhanced realtime listener setup
  const setupRealtimeListeners = useCallback(() => {
    if (!account?.id || subscriptionExpired || !mountedRef.current) {
      console.log('⏭️ تخطي إعداد التحديثات الفورية:', {
        hasAccount: !!account?.id,
        expired: subscriptionExpired,
        mounted: mountedRef.current
      });
      return;
    }

    // Clean up existing connections first
    cleanupChannels();

    console.log('🌐 إعداد مستمعات التحديث المحسنة للحساب:', account.id);
    
    try {
      // Account changes listener with enhanced error handling
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
            if (!mountedRef.current) return;
            
            console.log('🔄 تحديث بيانات الحساب المحسن:', {
              timestamp: new Date().toISOString(),
              changes: payload.new
            });
            
            if (payload.new?.rotation_interval !== undefined) {
              console.log('⏱️ تحديث فترة التبديل:', payload.new.rotation_interval);
              setRotationInterval(payload.new.rotation_interval);
              setAccount(prev => prev ? { ...prev, rotation_interval: payload.new.rotation_interval } : null);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 حالة اشتراك الحساب:', status);
          isConnectedRef.current = status === 'SUBSCRIBED';
        });

      // Website changes listener with enhanced stability
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
          (payload) => {
            if (!mountedRef.current) return;
            
            console.log('🚀 تحديث موقع محسن:', {
              event: payload.eventType,
              timestamp: new Date().toISOString(),
              websiteId: payload.new?.id || payload.old?.id
            });
            
            // Enhanced debounced update
            debouncedFetchWebsites(account, `realtime-${payload.eventType}`);
          }
        )
        .subscribe((status) => {
          console.log('📡 حالة اشتراك المواقع:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ تم الاشتراك بنجاح في التحديثات المحسنة!');
            isConnectedRef.current = true;
            
            // Clear retry attempts on successful connection
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ خطأ في الاشتراك - إعادة الاتصال:', status);
            isConnectedRef.current = false;
            
            // Enhanced retry with exponential backoff
            const retryDelay = isConnectedRef.current ? 5000 : 15000;
            
            retryTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                console.log('🔄 إعادة محاولة الاتصال المحسن');
                setupRealtimeListeners();
              }
            }, retryDelay);
          }
        });

      // Store channels for cleanup
      channelsRef.current = [accountChannel, websiteChannel];

    } catch (error) {
      console.error('❌ خطأ في إعداد المستمعات:', error);
      
      // Retry setup on error
      retryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log('🔄 إعادة محاولة إعداد المستمعات');
          setupRealtimeListeners();
        }
      }, 10000);
    }
  }, [account, subscriptionExpired, debouncedFetchWebsites, setRotationInterval, setAccount, cleanupChannels]);

  // Setup listeners with account changes
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
      cleanupChannels();
    };
  }, [cleanupChannels]);
};
