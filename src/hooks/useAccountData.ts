
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
  
  // Refs for stability and deduplication
  const lastFetchTime = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyFetching = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const websitesSnapshot = useRef<string>('');

  // Enhanced deduplication hash
  const createWebsitesHash = useCallback((websitesData: Website[]) => {
    return JSON.stringify(
      websitesData
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(w => ({
          id: w.id,
          url: w.website_url,
          active: w.is_active,
          title: w.website_title
        }))
    );
  }, []);

  const isSubscriptionExpired = useCallback((account: Account) => {
    if (!account.activation_end_date) return false;
    return new Date(account.activation_end_date) < new Date();
  }, []);

  // Enhanced fetch with retry logic and better error handling
  const fetchWebsites = useCallback(async (accountData: Account, forceRefresh = false) => {
    if (!mountedRef.current || !accountData?.id) return [];

    const now = Date.now();
    
    // Prevent rapid successive calls with better timing
    if (!forceRefresh && (now - lastFetchTime.current < 2000 || isCurrentlyFetching.current)) {
      console.log('⏭️ منع الجلب السريع - الانتظار للاستقرار');
      return websites;
    }

    isCurrentlyFetching.current = true;
    
    try {
      console.log('🔍 جلب المواقع مع محاولة إعادة تحسينة:', {
        accountId: accountData.id,
        forceRefresh,
        lastFetch: now - lastFetchTime.current
      });

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
      if (forceRefresh || newHash !== websitesSnapshot.current) {
        console.log('✅ تحديث المواقع - تغيير حقيقي مكتشف:', {
          websitesCount: activeWebsites.length,
          forced: forceRefresh
        });
        
        if (mountedRef.current) {
          setWebsites([...activeWebsites]);
          websitesSnapshot.current = newHash;
          setError(null);
        }
      } else {
        console.log('ℹ️ لا توجد تغييرات في المواقع');
      }
      
      lastFetchTime.current = now;
      return activeWebsites;
      
    } catch (error: any) {
      console.error('❌ خطأ في fetchWebsites:', error);
      
      if (mountedRef.current) {
        setError('فشل في تحميل المواقع');
        
        // Retry logic for network errors
        if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
          console.log('🔄 محاولة إعادة الاتصال خلال 5 ثوانٍ...');
          
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log('🔄 إعادة محاولة جلب المواقع');
              fetchWebsites(accountData, true);
            }
          }, 5000);
        }
      }
      
      return [];
    } finally {
      isCurrentlyFetching.current = false;
    }
  }, [websites, createWebsitesHash]);

  // Enhanced initial data fetch with better error handling
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!accountId || !mountedRef.current) {
        setError('معرف الحساب غير صحيح');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 جلب بيانات الحساب المحسن:', accountId);
        
        // Try by ID first
        let { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', accountId)
          .eq('status', 'active')
          .maybeSingle();

        // If not found by ID, try by name
        if (!accountData && !accountError) {
          console.log('🔍 البحث بالاسم:', accountId);
          const { data: accountByName, error: nameError } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', accountId)
            .eq('status', 'active')
            .maybeSingle();
            
          if (nameError) {
            throw nameError;
          }
          
          accountData = accountByName;
        }

        if (accountError) {
          throw accountError;
        }

        if (!accountData) {
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

          // Fetch websites with initial force refresh
          await fetchWebsites(accountData, true);
        }

      } catch (error: any) {
        console.error('❌ خطأ في fetchAccountData:', error);
        
        if (mountedRef.current) {
          let errorMessage = 'حدث خطأ في تحميل البيانات';
          
          if (error.message?.includes('Failed to fetch')) {
            errorMessage = 'مشكلة في الاتصال - يرجى التحقق من الإنترنت';
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
    if (account && mountedRef.current) {
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
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

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
