
import { useEffect } from 'react';
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

  // Enhanced realtime listener for website changes
  useEffect(() => {
    if (!account?.id || subscriptionExpired) {
      console.log('⏭️ تخطي إعداد التحديثات الفورية للمواقع');
      return;
    }

    console.log('🌐 إعداد مستمع التحديثات الفورية للمواقع');
    console.log('🆔 معرف الحساب:', account.id);
    
    const channelName = `website-realtime-${account.id}`;
    
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
          console.log('🚀 تحديث فوري للموقع:', payload);
          console.log('📅 الوقت:', new Date().toISOString());
          console.log('🎯 نوع الحدث:', payload.eventType);
          
          try {
            console.log('🔄 إعادة جلب المواقع...');
            await fetchWebsites(account);
            console.log('✅ تم تحديث المواقع بنجاح');
          } catch (error) {
            console.error('❌ خطأ في تحديث المواقع:', error);
            
            // إعادة المحاولة مرة واحدة بعد تأخير قصير
            setTimeout(async () => {
              try {
                console.log('🔄 إعادة المحاولة...');
                await fetchWebsites(account);
                console.log('✅ نجحت إعادة المحاولة');
              } catch (retryError) {
                console.error('❌ فشلت إعادة المحاولة:', retryError);
              }
            }, 1000);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة اشتراك التحديثات للمواقع:', status);
        console.log('📺 اسم القناة:', channelName);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ تم الاشتراك بنجاح في التحديثات الفورية للمواقع!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ خطأ في الاشتراك');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ انتهت مهلة الاشتراك');
        }
      });

    return () => {
      console.log('🧹 تنظيف مستمع التحديثات للمواقع');
      console.log('📺 إزالة القناة:', channelName);
      supabase.removeChannel(channel);
    };
  }, [account?.id, subscriptionExpired, fetchWebsites]);
};
