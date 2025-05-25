
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { useBreakTimers } from '@/hooks/useBreakTimers';
import NotificationPopup from '@/components/NotificationPopup';
import BreakTimerDisplay from '@/components/BreakTimerDisplay';

interface Account {
  id: string;
  name: string;
  email: string;
  database_name: string;
  status: 'active' | 'suspended' | 'pending';
  activation_start_date: string | null;
  activation_end_date: string | null;
  is_subscription_active: boolean | null;
}

interface Website {
  id: string;
  website_url: string;
  website_title: string | null;
  iframe_content: string | null;
  is_active: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string | null;
  image_url: string | null;
  position: string;
  display_duration: number;
  is_active: boolean;
}

interface BreakTimer {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  position: string;
}

const ClientPublicPage = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [currentWebsiteIndex, setCurrentWebsiteIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [activeTimers, setActiveTimers] = useState<BreakTimer[]>([]);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { fetchActiveNotifications } = useNotifications();
  const { fetchActiveTimers } = useBreakTimers();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;
      setIsMobile(mobile);
      console.log('📱 Device detection:', mobile ? 'Mobile' : 'Desktop');
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function to check if subscription is expired
  const isSubscriptionExpired = (account: Account) => {
    if (!account.activation_end_date) return false;
    return new Date(account.activation_end_date) < new Date();
  };

  // Function to check if current time is within timer range
  const isTimerActive = (timer: BreakTimer) => {
    const now = new Date();
    const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    const [startHours, startMinutes] = timer.start_time.split(':').map(Number);
    const startTimeSeconds = startHours * 3600 + startMinutes * 60;
    
    const [endHours, endMinutes] = timer.end_time.split(':').map(Number);
    const endTimeSeconds = endHours * 3600 + endMinutes * 60;
    
    return currentTime >= startTimeSeconds && currentTime <= endTimeSeconds;
  };

  // Function to validate URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // INSTANT websites fetch - no delays
  const fetchWebsites = async (accountData?: Account) => {
    const targetAccount = accountData || account;
    if (!targetAccount?.id) return;

    try {
      console.log('⚡ [INSTANT FETCH] Getting websites for:', targetAccount.id);
      
      const { data: websiteData, error: websiteError } = await supabase
        .from('account_websites')
        .select('*')
        .eq('account_id', targetAccount.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (websiteError) {
        console.error('❌ [INSTANT FETCH] Error:', websiteError);
        setWebsites([]);
        return;
      }

      console.log('📊 [INSTANT FETCH] Raw data:', websiteData?.length || 0, 'websites');
      
      // Filter valid URLs only
      const activeWebsites = (websiteData || []).filter(website => {
        const isValid = isValidUrl(website.website_url);
        if (!isValid) {
          console.warn('⚠️ [INSTANT FETCH] Invalid URL:', website.website_url);
        }
        return isValid;
      });
      
      console.log('✅ [INSTANT FETCH] Active websites:', activeWebsites.length);
      
      // IMMEDIATE state update
      setWebsites(activeWebsites);
      setCurrentWebsiteIndex(0);
      setIframeLoading(activeWebsites.length > 0);
      setIframeError(false);
      setRefreshKey(prev => prev + 1);
      
      console.log('🚀 [INSTANT FETCH] State updated immediately with', activeWebsites.length, 'websites');
    } catch (error) {
      console.error('❌ [INSTANT FETCH] Exception:', error);
      setWebsites([]);
    }
  };

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!accountId) {
        setError('معرف الحساب غير صحيح');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [ACCOUNT] Fetching account data for:', accountId);
        
        // First try to search by ID
        let { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', accountId)
          .eq('status', 'active')
          .single();

        // If not found, search by name
        if (accountError || !accountData) {
          console.log('🔍 [ACCOUNT] Searching by name:', accountId);
          const { data: accountByName, error: nameError } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', accountId)
            .eq('status', 'active')
            .single();
            
          if (nameError || !accountByName) {
            console.error('❌ [ACCOUNT] Error:', nameError);
            setError('لم يتم العثور على الحساب أو أنه غير نشط');
            setLoading(false);
            return;
          }
          
          accountData = accountByName;
        }

        console.log('✅ [ACCOUNT] Data fetched successfully:', accountData.name);
        
        // Check if subscription is expired
        if (isSubscriptionExpired(accountData)) {
          setSubscriptionExpired(true);
          setAccount(accountData);
          setLoading(false);
          return;
        }

        setAccount(accountData);
        await fetchWebsites(accountData);

      } catch (error) {
        console.error('❌ [ACCOUNT] Exception:', error);
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId]);

  // INSTANT realtime listener - no delays, immediate response
  useEffect(() => {
    if (!account?.id || subscriptionExpired) {
      return;
    }

    console.log('⚡ [INSTANT REALTIME] Setting up immediate listener for:', account.id);
    
    const websiteChannel = supabase
      .channel(`instant_websites_${account.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_websites',
          filter: `account_id=eq.${account.id}`
        },
        async (payload) => {
          console.log('⚡ [INSTANT REALTIME] Change detected immediately!', {
            event: payload.eventType,
            timestamp: new Date().toISOString()
          });
          
          // INSTANT response - no waiting
          fetchWebsites();
        }
      )
      .subscribe((status) => {
        console.log('📡 [INSTANT REALTIME] Status:', status);
      });

    // Super fast polling for mobile - every 1 second
    const fastInterval = setInterval(() => {
      console.log('🔄 [INSTANT POLLING] Checking for updates');
      fetchWebsites();
    }, 1000);

    // Mobile specific events for immediate updates
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ [INSTANT] Page visible - immediate fetch');
        fetchWebsites();
      }
    };

    const handleFocus = () => {
      console.log('🎯 [INSTANT] Window focused - immediate fetch');
      fetchWebsites();
    };

    const handleTouchStart = () => {
      console.log('👆 [INSTANT] Touch detected - immediate fetch');
      fetchWebsites();
    };

    const handlePageShow = () => {
      console.log('📱 [INSTANT] Page shown - immediate fetch');
      fetchWebsites();
    };

    // Add all event listeners for immediate response
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      console.log('🧹 [INSTANT CLEANUP] Removing all instant listeners');
      supabase.removeChannel(websiteChannel);
      clearInterval(fastInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [account?.id, subscriptionExpired]);

  // Enhanced realtime listener for notifications
  useEffect(() => {
    if (!account?.id || subscriptionExpired) return;

    const fetchAndSetNotifications = async () => {
      try {
        console.log('🔔 Fetching initial notifications for account:', account.id);
        const notifications = await fetchActiveNotifications(account.id);
        console.log('✅ Initial notifications loaded:', notifications);
        setActiveNotifications(notifications);
      } catch (error) {
        console.error('❌ Error fetching initial notifications:', error);
      }
    };

    fetchAndSetNotifications();

    const notificationChannel = supabase
      .channel(`notifications-${account.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `account_id=eq.${account.id}`
        },
        async (payload) => {
          console.log('🔔 Notification change detected:', payload.eventType, payload);
          
          // Immediate response based on event type
          if (payload.eventType === 'INSERT' && (payload.new as any)?.is_active) {
            setActiveNotifications(prev => [...prev, payload.new as Notification]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            if (updatedNotification.is_active) {
              setActiveNotifications(prev => {
                const exists = prev.find(n => n.id === updatedNotification.id);
                if (exists) {
                  return prev.map(n => n.id === updatedNotification.id ? updatedNotification : n);
                } else {
                  return [...prev, updatedNotification];
                }
              });
            } else {
              setActiveNotifications(prev => prev.filter(n => n.id !== updatedNotification.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setActiveNotifications(prev => prev.filter(n => n.id !== (payload.old as any)?.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [account?.id, fetchActiveNotifications, subscriptionExpired]);

  // Enhanced realtime listener for break timers
  useEffect(() => {
    const checkTimers = async () => {
      if (!account?.id || subscriptionExpired) return;

      try {
        const timers = await fetchActiveTimers(account.id);
        const currentActiveTimers = timers.filter(isTimerActive);
        setActiveTimers(currentActiveTimers);
      } catch (error) {
        console.error('❌ Error fetching timers:', error);
      }
    };

    checkTimers();
    const timerInterval = setInterval(checkTimers, 10000);

    // Add realtime listener for break timers
    if (account?.id && !subscriptionExpired) {
      const timerChannel = supabase
        .channel(`break_timers-${account.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'break_timers',
            filter: `account_id=eq.${account.id}`
          },
          async (payload) => {
            console.log('⏰ Timer change detected:', payload.eventType, payload);
            // Immediate check for active timers
            await checkTimers();
          }
        )
        .subscribe();

      return () => {
        clearInterval(timerInterval);
        supabase.removeChannel(timerChannel);
      };
    }

    return () => clearInterval(timerInterval);
  }, [account?.id, fetchActiveTimers, subscriptionExpired]);

  // INSTANT website rotation - NO DELAY
  useEffect(() => {
    if (websites.length <= 1 || subscriptionExpired) return;

    // النقل الفوري - بدون تأخير على الإطلاق
    const interval = setInterval(() => {
      setCurrentWebsiteIndex((prev) => {
        const nextIndex = (prev + 1) % websites.length;
        console.log('⚡ [INSTANT SWITCH] Switching NOW to website:', nextIndex, websites[nextIndex]?.website_url);
        setIframeLoading(true);
        setIframeError(false);
        return nextIndex;
      });
    }, 1000); // ثانية واحدة فقط للنقل

    return () => clearInterval(interval);
  }, [websites.length, subscriptionExpired]);

  const handleNotificationClose = (notificationId: string) => {
    console.log('👋 User closed notification:', notificationId);
    setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleTimerClose = (timerId: string) => {
    setActiveTimers(prev => prev.filter(t => t.id !== timerId));
  };

  const handleIframeLoad = () => {
    console.log('✅ [IFRAME] Website loaded successfully:', websites[currentWebsiteIndex]?.website_url);
    setIframeLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    console.error('❌ [IFRAME] Failed to load website:', websites[currentWebsiteIndex]?.website_url);
    setIframeLoading(false);
    setIframeError(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">خطأ</h1>
          <p className="text-gray-600">{error || 'لم يتم العثور على الحساب'}</p>
        </div>
      </div>
    );
  }

  // Show subscription expired message
  if (subscriptionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              انتهت صلاحية الحساب
            </h1>
            
            <p className="text-gray-600 mb-6">
              عذراً، لقد انتهت صلاحية حساب <strong>{account.name}</strong> في تاريخ{' '}
              {account.activation_end_date ? 
                new Date(account.activation_end_date).toLocaleDateString('ar-SA') 
                : 'غير محدد'
              }
            </p>
            
            <p className="text-sm text-gray-500 mb-8">
              لتجديد الاشتراك والمتابعة، يرجى التواصل معنا عبر الرابط أدناه
            </p>
            
            <a
              href="https://trndsky.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              تجديد الاشتراك
            </a>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                للمساعدة التقنية: support@trndsky.com
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentWebsite = websites[currentWebsiteIndex];
  const hasActiveWebsites = websites.length > 0;

  return (
    <div className="w-full h-screen overflow-hidden bg-black relative" key={`page-${refreshKey}`}>
      {/* Loading indicator */}
      {(iframeLoading && currentWebsite) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">جاري تحميل الموقع...</p>
            <p className="text-sm text-gray-300 mt-2">{currentWebsite.website_url}</p>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {(iframeError && currentWebsite) && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 z-10">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg">فشل في تحميل الموقع</p>
            <p className="text-sm text-gray-300 mt-2">{currentWebsite.website_url}</p>
            <p className="text-xs text-gray-400 mt-2">قد يكون الموقع لا يدعم العرض في iframe</p>
          </div>
        </div>
      )}

      {/* Main Content - Full Screen */}
      {!hasActiveWebsites ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-xl font-semibold mb-2">
              مرحباً بك في {account?.name}
            </h2>
            <p className="text-gray-300">لا توجد مواقع نشطة حالياً</p>
            <p className="text-sm text-gray-400 mt-2">
              ⚡ التحديث الفوري مُفعّل
            </p>
          </div>
        </div>
      ) : currentWebsite ? (
        <iframe
          key={`website-${currentWebsite.id}-${refreshKey}`}
          src={currentWebsite.website_url}
          title={currentWebsite.website_title || currentWebsite.website_url}
          className="w-full h-full border-0"
          style={{
            margin: 0,
            padding: 0,
            width: '100vw',
            height: '100vh',
            position: 'absolute',
            top: 0,
            left: 0,
            border: 'none'
          }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-modals allow-top-navigation allow-downloads"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen; picture-in-picture; autoplay; encrypted-media; accelerometer; gyroscope; camera; microphone; geolocation; payment"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      ) : null}

      {/* Active Notifications */}
      {activeNotifications.map((notification) => (
        <NotificationPopup
          key={notification.id}
          notification={notification}
          onClose={() => handleNotificationClose(notification.id)}
        />
      ))}

      {/* Active Timers */}
      {activeTimers.map((timer) => (
        <BreakTimerDisplay
          key={timer.id}
          timer={timer}
          onClose={() => handleTimerClose(timer.id)}
        />
      ))}

      {/* Enhanced debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 left-0 bg-black bg-opacity-75 text-white text-xs p-2 z-50">
          <div>⚡ النقل الفوري: مُفعّل (1 ثانية)</div>
          <div>📱 الجهاز: {isMobile ? 'موبايل' : 'ديسكتوب'}</div>
          <div>✅ المواقع النشطة: {websites.length}</div>
          <div>📍 الموقع الحالي: {currentWebsiteIndex + 1}</div>
          <div>⏳ حالة التحميل: {iframeLoading ? 'جاري التحميل' : 'مكتمل'}</div>
          <div>❌ خطأ: {iframeError ? 'نعم' : 'لا'}</div>
          <div>🔄 Refresh Key: {refreshKey}</div>
          <div>🚀 Realtime: فوري (1 ثانية)</div>
        </div>
      )}
    </div>
  );
};

export default ClientPublicPage;
