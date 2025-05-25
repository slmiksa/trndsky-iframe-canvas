
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
  fetchWebsites: (account: Account) => Promise<void>;
}

export const useRealtimeUpdates = ({
  account,
  subscriptionExpired,
  setRotationInterval,
  setAccount,
  fetchWebsites
}: UseRealtimeUpdatesProps) => {
  // Setup realtime listener for account changes (including rotation_interval)
  useEffect(() => {
    if (!account?.id || subscriptionExpired) {
      console.log('⏭️ Skipping account realtime setup - no account or subscription expired');
      return;
    }

    console.log('🔄 Setting up realtime listener for account changes');
    
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
          console.log('🔄 Account change detected:', payload);
          
          if (payload.new?.rotation_interval !== undefined) {
            console.log('🔄 Rotation interval updated:', payload.new.rotation_interval);
            setRotationInterval(payload.new.rotation_interval);
            setAccount(prev => prev ? { ...prev, rotation_interval: payload.new.rotation_interval } : null);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 Account realtime subscription status:', status);
      });

    return () => {
      console.log('🔄 Cleaning up account realtime listener');
      supabase.removeChannel(accountChannel);
    };
  }, [account?.id, subscriptionExpired, setRotationInterval, setAccount]);

  // Enhanced realtime listener for immediate website changes
  useEffect(() => {
    if (!account?.id || subscriptionExpired) {
      console.log('⏭️ Skipping realtime setup - no account or subscription expired');
      return;
    }

    console.log('🔄 Setting up ENHANCED realtime listener for immediate updates');
    console.log('🔄 Account ID:', account.id);
    
    const channelName = `fast-updates-${account.id}`;
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false }, // Don't receive our own changes
          presence: { key: account.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'account_websites',
          filter: `account_id=eq.${account.id}`
        },
        async (payload) => {
          console.log('🚀 IMMEDIATE website change detected:', payload);
          console.log('🚀 Event:', payload.eventType);
          console.log('🚀 Timestamp:', new Date().toISOString());
          
          // Immediate refresh without any delay for instant updates
          console.log('🚀 Instantly refreshing websites...');
          try {
            await fetchWebsites(account);
            console.log('✅ Websites refreshed successfully');
          } catch (error) {
            console.error('❌ Error refreshing websites:', error);
            // Retry once after a short delay if there's an error
            setTimeout(async () => {
              try {
                await fetchWebsites(account);
                console.log('✅ Websites refreshed on retry');
              } catch (retryError) {
                console.error('❌ Retry failed:', retryError);
              }
            }, 500);
          }
        }
      )
      .subscribe((status) => {
        console.log('🚀 Fast updates subscription status:', status);
        console.log('🚀 Channel name:', channelName);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to FAST realtime updates!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to fast updates');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Fast updates subscription timed out');
        }
      });

    return () => {
      console.log('🔄 Cleaning up fast updates listener');
      console.log('🔄 Removing channel:', channelName);
      supabase.removeChannel(channel);
    };
  }, [account?.id, subscriptionExpired, fetchWebsites]);
};
