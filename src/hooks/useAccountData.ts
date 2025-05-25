
import { useState, useEffect } from 'react';
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

export const useAccountData = (accountId: string | undefined) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(30);

  const isSubscriptionExpired = (account: Account) => {
    if (!account.activation_end_date) return false;
    return new Date(account.activation_end_date) < new Date();
  };

  // Enhanced fetchWebsites function for faster updates
  const fetchWebsites = async (accountData: Account) => {
    try {
      console.log('🚀 ENHANCED fetching websites for account:', accountData.id);
      
      const { data: websiteData, error: websiteError } = await supabase
        .from('account_websites')
        .select('*')
        .eq('account_id', accountData.id)
        .eq('is_active', true) // Only fetch active websites
        .order('created_at', { ascending: true });

      if (websiteError) {
        console.error('❌ Error fetching websites:', websiteError);
        setWebsites([]);
        return;
      }

      console.log('✅ Active websites fetched:', websiteData);
      
      // Immediate state update for instant UI response
      setWebsites(websiteData || []);
      console.log('🚀 Websites state updated instantly with count:', (websiteData || []).length);
      
    } catch (error) {
      console.error('❌ Error in fetchWebsites:', error);
      setWebsites([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!accountId) {
        setError('معرف الحساب غير صحيح');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching account data for:', accountId);
        
        let { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', accountId)
          .eq('status', 'active')
          .single();

        if (accountError || !accountData) {
          console.log('🔍 Searching by name:', accountId);
          const { data: accountByName, error: nameError } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', accountId)
            .eq('status', 'active')
            .single();
            
          if (nameError || !accountByName) {
            console.error('❌ Error fetching account:', nameError);
            setError('لم يتم العثور على الحساب أو أنه غير نشط');
            setLoading(false);
            return;
          }
          
          accountData = accountByName;
        }

        console.log('✅ Account data fetched:', accountData);
        
        setRotationInterval(accountData.rotation_interval || 30);
        
        if (isSubscriptionExpired(accountData)) {
          setSubscriptionExpired(true);
          setAccount(accountData);
          setLoading(false);
          return;
        }

        setAccount(accountData);
        await fetchWebsites(accountData);

      } catch (error) {
        console.error('❌ Error in fetchAccountData:', error);
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId]);

  // Enhanced realtime subscription for instant updates
  useEffect(() => {
    if (!account?.id || subscriptionExpired) {
      console.log('⏭️ Skipping realtime subscription - no account or subscription expired');
      return;
    }

    console.log('🔄 Setting up ENHANCED realtime subscription for instant website updates');
    
    const channelName = `instant-website-updates-${account.id}`;
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: account.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'account_websites',
          filter: `account_id=eq.${account.id}`
        },
        async (payload) => {
          console.log('🚀 INSTANT website update detected:', payload);
          console.log('🚀 Event type:', payload.eventType);
          console.log('🚀 New data:', payload.new);
          console.log('🚀 Old data:', payload.old);
          
          // Immediate refresh for all events
          console.log('🚀 Triggering instant website refresh...');
          try {
            await fetchWebsites(account);
            console.log('✅ Instant website refresh completed');
          } catch (error) {
            console.error('❌ Error in instant refresh:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🚀 Realtime subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to instant website updates!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error in realtime subscription');
        }
      });

    return () => {
      console.log('🔄 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [account?.id, subscriptionExpired]);

  return {
    account,
    websites,
    loading,
    error,
    subscriptionExpired,
    rotationInterval,
    setRotationInterval,
    setAccount,
    fetchWebsites
  };
};
