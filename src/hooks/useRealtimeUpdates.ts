
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

  // Debounced fetch function to prevent rapid successive calls
  const debouncedFetchWebsites = (accountData: Account) => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔄 تحديث المواقع المتأخر (debounced)');
        await fetchWebsites(accountData);
        console.log('✅ تم تحديث المواقع بنجاح');
      } catch (error) {
        console.error('❌ خطأ في التحديث المتأخر:', error);
      }
    }, 1000); // Wait 1 second before updating
  };

  // Setup realtime listener for account changes
  useEffect(() => {
    if (!account?.id || subscriptionExpired) {
      console.log('⏭️ تخطي إعداد التحديثات الفورية للحساب');
      return;
    }

    console.log('🔄 إعداد مستمع التحديثات الفورية للحساب');
    
    const accountChannelName = `account-changes-${account.id}`;
    
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
          console.log('🔄 تغيير في بيانات الحساب:', payload);
          
          if (payload.new?.rotation_interval !== undefined) {
            console.log('⏱️ تحديث فترة التبديل:', payload.new.rotation_interval);
            setRotationInterval(payload.new.rotation_interval);
            setAccount(prev => prev ? { ...prev, rotation_interval: payload.new.rotation_interval } : null);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة اشتراك التحديثات للحساب:', status);
      });

    return () => {
      console.log('🧹 تنظيف مستمع التحديثات للحساب');
      supabase.removeChannel(accountChannel);
    };
  }, [account?.id, subscriptionExpired, setRotationInterval, setAccount]);

  // Enhanced but stable realtime listener for website changes
  useEffect(() => {
    if (!account?.id || subscriptionExpired) {
      console.log('⏭️ تخطي إعداد التحديثات الفورية للمواقع');
      return;
    }

    console.log('🌐 إعداد مستمع التحديثات الفورية الثابت للمواقع');
    console.log('🆔 معرف الحساب:', account.id);
    
    const channelName = `website-stable-${account.id}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_websites',
          filter: `account_id=eq.${account.id}`
        },
        async (payload) => {
          console.log('🚀 تحديث فوري ثابت للموقع:', payload);
          console.log('📅 الوقت:', new Date().toISOString());
          console.log('🎯 نوع الحدث:', payload.eventType);
          
          // Use debounced fetch to prevent rapid updates
          debouncedFetchWebsites(account);
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة اشتراك التحديثات الثابت للمواقع:', status);
        console.log('📺 اسم القناة:', channelName);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ تم الاشتراك بنجاح في التحديثات الفورية الثابتة!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ خطأ في الاشتراك');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ انتهت مهلة الاشتراك');
        }
      });

    return () => {
      console.log('🧹 تنظيف مستمع التحديثات الثابت للمواقع');
      console.log('📺 إزالة القناة:', channelName);
      
      // Clear any pending timeouts
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      supabase.removeChannel(channel);
    };
  }, [account?.id, subscriptionExpired, fetchWebsites]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);
};
