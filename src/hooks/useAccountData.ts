
import { useState, useEffect, useCallback } from 'react';
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
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [websitesHash, setWebsitesHash] = useState<string>('');

  // Function to create a simple hash of websites data
  const createWebsitesHash = (websitesData: Website[]) => {
    return JSON.stringify(websitesData.map(w => ({
      id: w.id,
      url: w.website_url,
      active: w.is_active
    })));
  };

  const isSubscriptionExpired = (account: Account) => {
    if (!account.activation_end_date) return false;
    return new Date(account.activation_end_date) < new Date();
  };

  // Enhanced fetch websites function with data comparison
  const fetchWebsites = useCallback(async (accountData: Account) => {
    try {
      const now = Date.now();
      
      // Prevent rapid successive calls - increased interval for stability
      if (now - lastFetchTime < 1000) {
        console.log('⏭️ تخطي الجلب - منع التحديث السريع');
        return websites;
      }
      
      console.log('🔍 جلب المواقع مع فحص التغييرات للحساب:', accountData.id);
      
      const { data: websiteData, error: websiteError } = await supabase
        .from('account_websites')
        .select('*')
        .eq('account_id', accountData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (websiteError) {
        console.error('❌ خطأ في جلب المواقع:', websiteError);
        throw websiteError;
      }

      const activeWebsites = websiteData || [];
      const newHash = createWebsitesHash(activeWebsites);
      
      // Only update if data actually changed
      if (newHash !== websitesHash) {
        console.log('🔄 تغيير حقيقي في المواقع - التحديث مطلوب');
        console.log('📊 عدد المواقع الجديدة:', activeWebsites.length);
        
        setWebsites([...activeWebsites]);
        setWebsitesHash(newHash);
        setLastFetchTime(now);
        
        console.log('✅ تم تحديث المواقع بنجاح');
      } else {
        console.log('⏺️ لا توجد تغييرات في المواقع - لا حاجة للتحديث');
        setLastFetchTime(now);
      }
      
      return activeWebsites;
      
    } catch (error) {
      console.error('❌ خطأ في fetchWebsites:', error);
      setWebsites([]);
      throw error;
    }
  }, [lastFetchTime, websitesHash]);

  // Enhanced initial data fetch
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!accountId) {
        setError('معرف الحساب غير صحيح');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 جلب بيانات الحساب:', accountId);
        
        let { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', accountId)
          .eq('status', 'active')
          .single();

        if (accountError || !accountData) {
          console.log('🔍 البحث بالاسم:', accountId);
          const { data: accountByName, error: nameError } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', accountId)
            .eq('status', 'active')
            .single();
            
          if (nameError || !accountByName) {
            console.error('❌ خطأ في جلب الحساب:', nameError);
            setError('لم يتم العثور على الحساب أو أنه غير نشط');
            setLoading(false);
            return;
          }
          
          accountData = accountByName;
        }

        console.log('✅ تم جلب بيانات الحساب:', accountData);
        
        setAccount(accountData);
        setRotationInterval(accountData.rotation_interval || 30);
        
        if (isSubscriptionExpired(accountData)) {
          setSubscriptionExpired(true);
          setLoading(false);
          return;
        }

        // جلب المواقع النشطة
        const activeWebsites = await fetchWebsites(accountData);
        console.log('🌐 المواقع النشطة المحملة:', activeWebsites.length);

      } catch (error) {
        console.error('❌ خطأ في fetchAccountData:', error);
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId, fetchWebsites]);

  // Force refresh function for manual updates
  const forceRefresh = useCallback(async () => {
    if (account) {
      console.log('🔄 تحديث يدوي للمواقع');
      // Reset hash to force update
      setWebsitesHash('');
      await fetchWebsites(account);
    }
  }, [account, fetchWebsites]);

  return {
    account,
    websites,
    loading,
    error,
    subscriptionExpired,
    rotationInterval,
    setRotationInterval,
    setAccount,
    fetchWebsites,
    forceRefresh
  };
};
