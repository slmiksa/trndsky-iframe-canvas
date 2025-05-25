
import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Enhanced stability refs
  const mountedRef = useRef<boolean>(true);
  const lastFetchTime = useRef<number>(0);
  const isCurrentlyFetching = useRef<boolean>(false);
  const stableWebsitesRef = useRef<Website[]>([]);
  const lastWebsitesHash = useRef<string>('');

  const isSubscriptionExpired = useCallback((account: Account) => {
    if (!account.activation_end_date) return false;
    return new Date(account.activation_end_date) < new Date();
  }, []);

  // Helper function to check if string is UUID format
  const isUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Create a stable hash for websites comparison
  const createWebsitesHash = useCallback((websitesData: Website[]) => {
    return JSON.stringify(
      websitesData
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(w => ({ id: w.id, url: w.website_url, active: w.is_active }))
    );
  }, []);

  // Fetch websites with enhanced stability
  const fetchWebsites = useCallback(async (accountData: Account, forceRefresh = false) => {
    if (!mountedRef.current || !accountData?.id) return stableWebsitesRef.current;

    const now = Date.now();
    
    // Prevent rapid calls for visitors - shorter delay
    if (!forceRefresh && (now - lastFetchTime.current < 1000 || isCurrentlyFetching.current)) {
      console.log('⏭️ منع الجلب السريع للاستقرار');
      return stableWebsitesRef.current;
    }

    isCurrentlyFetching.current = true;
    
    try {
      console.log('🔍 جلب المواقع:', { accountId: accountData.id, forceRefresh });

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
      
      // Update immediately for visitors to see changes faster
      if (forceRefresh || newHash !== lastWebsitesHash.current) {
        console.log('✅ تحديث المواقع:', {
          count: activeWebsites.length,
          forced: forceRefresh,
          changed: newHash !== lastWebsitesHash.current
        });
        
        if (mountedRef.current) {
          stableWebsitesRef.current = [...activeWebsites];
          setWebsites([...activeWebsites]);
          lastWebsitesHash.current = newHash;
          setError(null);
        }
      } else {
        console.log('ℹ️ لا توجد تغييرات في المواقع');
      }
      
      lastFetchTime.current = now;
      return stableWebsitesRef.current;
      
    } catch (error: any) {
      console.error('❌ خطأ في fetchWebsites:', error);
      
      if (mountedRef.current) {
        setError('فشل في تحميل المواقع');
      }
      
      return stableWebsitesRef.current;
    } finally {
      isCurrentlyFetching.current = false;
    }
  }, [createWebsitesHash]);

  // Enhanced initial data fetch with better error handling
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!accountId || !mountedRef.current) {
        console.log('⚠️ لا يوجد معرف حساب أو تم إلغاء التحميل');
        setError('معرف الحساب مطلوب');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 جلب بيانات الحساب:', accountId);
        
        let accountData = null;

        // البحث بالمعرف UUID أولاً
        if (isUUID(accountId)) {
          console.log('🔍 البحث بالمعرف UUID:', accountId);
          const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', accountId)
            .eq('status', 'active')
            .maybeSingle();

          if (error && !error.message.includes('PGRST116')) {
            console.error('❌ خطأ في البحث بالمعرف:', error);
            throw error;
          }
          
          accountData = data;
        }

        // البحث بالاسم إذا لم يتم العثور على الحساب بالمعرف
        if (!accountData) {
          console.log('🔍 البحث بالاسم:', accountId);
          const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', accountId)
            .eq('status', 'active')
            .maybeSingle();
            
          if (error && !error.message.includes('PGRST116')) {
            console.error('❌ خطأ في البحث بالاسم:', error);
            throw error;
          }
          
          accountData = data;
        }

        if (!accountData) {
          console.log('❌ لم يتم العثور على الحساب:', accountId);
          setError('لم يتم العثور على الحساب أو أنه غير نشط');
          setLoading(false);
          return;
        }

        console.log('✅ تم جلب بيانات الحساب بنجاح:', {
          id: accountData.id,
          name: accountData.name,
          status: accountData.status
        });
        
        if (mountedRef.current) {
          setAccount(accountData);
          setRotationInterval(accountData.rotation_interval || 30);
          
          if (isSubscriptionExpired(accountData)) {
            setSubscriptionExpired(true);
            setLoading(false);
            return;
          }

          // جلب المواقع
          await fetchWebsites(accountData, true);
        }

      } catch (error: any) {
        console.error('❌ خطأ في fetchAccountData:', error);
        
        if (mountedRef.current) {
          let errorMessage = 'حدث خطأ في تحميل البيانات';
          
          if (error.message?.includes('Failed to fetch')) {
            errorMessage = 'مشكلة في الاتصال - يرجى التحقق من الإنترنت';
          } else if (error.message?.includes('invalid input syntax for type uuid')) {
            errorMessage = 'تنسيق معرف الحساب غير صحيح';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          setError(errorMessage);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchAccountData();
  }, [accountId, fetchWebsites, isSubscriptionExpired]);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    if (account && mountedRef.current && !isCurrentlyFetching.current) {
      console.log('🔄 تحديث يدوي للمواقع');
      setError(null);
      await fetchWebsites(account, true);
    }
  }, [account, fetchWebsites]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      isCurrentlyFetching.current = false;
    };
  }, []);

  return {
    account,
    websites: stableWebsitesRef.current,
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
