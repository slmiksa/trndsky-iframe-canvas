import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { useBreakTimers } from '@/hooks/useBreakTimers';
import { useIsMobile } from '@/hooks/use-mobile';
import NotificationPopup from '@/components/NotificationPopup';
import BreakTimerDisplay from '@/components/BreakTimerDisplay';
import NewsTickerDisplay from '@/components/NewsTickerDisplay';

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
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [failedWebsites, setFailedWebsites] = useState<Set<string>>(new Set());
  const [retryCount, setRetryCount] = useState(0);
  const [currentErrorMessage, setCurrentErrorMessage] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { fetchActiveNotifications } = useNotifications();
  const { fetchActiveTimers } = useBreakTimers();

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

  // Enhanced fetch websites function with better error handling
  const fetchWebsites = async (accountData?: Account) => {
    const targetAccount = accountData || account;
    if (!targetAccount?.id) return;

    try {
      console.log('🔄 Fetching websites for:', targetAccount.id);
      
      const { data: websiteData, error: websiteError } = await supabase
        .from('account_websites')
        .select('*')
        .eq('account_id', targetAccount.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (websiteError) {
        console.error('❌ Error fetching websites:', websiteError);
        return;
      }

      console.log('📊 Fetched websites:', websiteData?.length || 0);
      
      // Filter valid URLs only
      const activeWebsites = (websiteData || []).filter(website => {
        const isValid = isValidUrl(website.website_url);
        if (!isValid) {
          console.warn('⚠️ Invalid URL:', website.website_url);
        }
        return isValid;
      });
      
      console.log('✅ Valid active websites:', activeWebsites.length);
      
      setWebsites(activeWebsites);
      if (activeWebsites.length > 0 && currentWebsiteIndex >= activeWebsites.length) {
        setCurrentWebsiteIndex(0);
      }
      
    } catch (error) {
      console.error('❌ Exception fetching websites:', error);
    }
  };

  // Enhanced website switching with error handling
  const switchToNextWebsite = () => {
    if (websites.length <= 1) return;

    setCurrentWebsiteIndex((prev) => {
      let nextIndex = (prev + 1) % websites.length;
      let attempts = 0;
      
      // Skip failed websites
      while (failedWebsites.has(websites[nextIndex]?.id) && attempts < websites.length) {
        nextIndex = (nextIndex + 1) % websites.length;
        attempts++;
      }
      
      // If all websites are failed, reset failed list and try again
      if (attempts >= websites.length) {
        console.log('🔄 All websites failed, resetting failed list');
        setFailedWebsites(new Set());
        nextIndex = (prev + 1) % websites.length;
      }
      
      const nextWebsite = websites[nextIndex];
      if (nextWebsite) {
        console.log('🔄 Switching to website:', nextWebsite.website_url);
        setIframeLoading(true);
        setIframeError(false);
        setCurrentErrorMessage(null);
        setRetryCount(0);
      }
      
      return nextIndex;
    });
  };

  // Retry failed website
  const retryCurrentWebsite = () => {
    const currentWebsite = websites[currentWebsiteIndex];
    if (!currentWebsite) return;

    console.log('🔄 Retrying website:', currentWebsite.website_url, 'Attempt:', retryCount + 1);
    setRetryCount(prev => prev + 1);
    setIframeLoading(true);
    setIframeError(false);
    setCurrentErrorMessage(null);
    
    // Force iframe refresh by updating the key
    setCurrentWebsiteIndex(prev => prev);
  };

  // Window focus/blur event handlers for desktop
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔍 Window focused - refreshing websites');
      setIsWindowFocused(true);
      if (account?.id && !subscriptionExpired) {
        fetchWebsites();
      }
    };

    const handleBlur = () => {
      console.log('👋 Window blurred');
      setIsWindowFocused(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page visible - refreshing websites');
        setIsWindowFocused(true);
        if (account?.id && !subscriptionExpired) {
          fetchWebsites();
        }
      } else {
        console.log('🙈 Page hidden');
        setIsWindowFocused(false);
      }
    };

    const handleBeforeUnload = () => {
      console.log('🚪 Page unloading');
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [account?.id, subscriptionExpired]);

  // Initial account data fetch
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!accountId) {
        setError('معرف الحساب غير صحيح');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching account data for:', accountId);
        
        // First try to search by ID
        let { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', accountId)
          .eq('status', 'active')
          .single();

        // If not found, search by name
        if (accountError || !accountData) {
          console.log('🔍 Searching by name:', accountId);
          const { data: accountByName, error: nameError } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', accountId)
            .eq('status', 'active')
            .single();
            
          if (nameError || !accountByName) {
            console.error('❌ Account not found:', nameError);
            setError('لم يتم العثور على الحساب أو أنه غير نشط');
            setLoading(false);
            return;
          }
          
          accountData = accountByName;
        }

        console.log('✅ Account data fetched:', accountData.name);
        
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
        console.error('❌ Account fetch exception:', error);
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId]);

  // Enhanced realtime listener with reconnection logic
  useEffect(() => {
    if (!account?.id || subscriptionExpired) {
      return;
    }

    console.log('📡 Setting up enhanced realtime listener:', account.id);
    
    let timeoutId: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const setupChannel = () => {
      const websiteChannel = supabase
        .channel(`websites_${account.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'account_websites',
            filter: `account_id=eq.${account.id}`
          },
          async (payload) => {
            console.log('📡 Website change detected:', payload.eventType);
            
            // Debounce rapid changes
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              fetchWebsites();
            }, 100);
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime status:', status);
          
          if (status === 'SUBSCRIBED') {
            reconnectAttempts = 0;
            console.log('✅ Realtime connected successfully');
          } else if (status === 'CHANNEL_ERROR' && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`🔄 Reconnecting... Attempt ${reconnectAttempts}`);
            setTimeout(setupChannel, 1000 * reconnectAttempts);
          }
        });

      return websiteChannel;
    };

    const channel = setupChannel();

    // Aggressive polling for all devices - 1 second intervals
    const aggressiveInterval = setInterval(() => {
      if (isWindowFocused) {
        console.log('🔄 Aggressive polling (1s interval)');
        fetchWebsites();
      }
    }, 1000);

    // Force refresh every 5 seconds as fallback
    const forceRefreshInterval = setInterval(() => {
      console.log('💪 Force refresh (5s fallback)');
      fetchWebsites();
    }, 5000);

    return () => {
      console.log('🧹 Cleaning up enhanced listeners');
      clearTimeout(timeoutId);
      clearInterval(aggressiveInterval);
      clearInterval(forceRefreshInterval);
      supabase.removeChannel(channel);
    };
  }, [account?.id, subscriptionExpired, isWindowFocused]);

  // Enhanced realtime listener for notifications
  useEffect(() => {
    if (!account?.id || subscriptionExpired) return;

    const fetchAndSetNotifications = async () => {
      try {
        console.log('🔔 Fetching notifications for:', account.id);
        const notifications = await fetchActiveNotifications(account.id);
        setActiveNotifications(notifications);
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
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
          console.log('🔔 Notification change:', payload.eventType);
          
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
            console.log('⏰ Timer change:', payload.eventType);
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

  // Enhanced website rotation with error handling
  useEffect(() => {
    if (websites.length <= 1 || subscriptionExpired) return;

    const interval = setInterval(() => {
      switchToNextWebsite();
    }, 3000);

    return () => clearInterval(interval);
  }, [websites.length, subscriptionExpired, failedWebsites]);

  // Auto-retry failed websites
  useEffect(() => {
    if (!iframeError || retryCount >= 3) return;

    const retryTimeout = setTimeout(() => {
      retryCurrentWebsite();
    }, 2000);

    return () => clearTimeout(retryTimeout);
  }, [iframeError, retryCount]);

  // Auto-skip after max retries
  useEffect(() => {
    if (iframeError && retryCount >= 3) {
      const currentWebsite = websites[currentWebsiteIndex];
      if (currentWebsite) {
        console.log('❌ Max retries reached, marking website as failed:', currentWebsite.website_url);
        setFailedWebsites(prev => new Set([...prev, currentWebsite.id]));
        
        setTimeout(() => {
          switchToNextWebsite();
        }, 1000);
      }
    }
  }, [iframeError, retryCount, currentWebsiteIndex]);

  const handleNotificationClose = (notificationId: string) => {
    console.log('👋 Closing notification:', notificationId);
    setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleTimerClose = (timerId: string) => {
    setActiveTimers(prev => prev.filter(t => t.id !== timerId));
  };

  const handleIframeLoad = () => {
    const currentWebsite = websites[currentWebsiteIndex];
    console.log('✅ Website loaded successfully:', currentWebsite?.website_url);
    setIframeLoading(false);
    setIframeError(false);
    setCurrentErrorMessage(null);
    setRetryCount(0);
    
    // Remove from failed list if it was there
    if (currentWebsite) {
      setFailedWebsites(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentWebsite.id);
        return newSet;
      });
    }
  };

  const handleIframeError = () => {
    const currentWebsite = websites[currentWebsiteIndex];
    console.error('❌ Website failed to load:', currentWebsite?.website_url);
    setIframeLoading(false);
    setIframeError(true);
    
    // Set specific error message based on common issues
    const errorMessages = [
      'فشل في تحميل الموقع - قد يكون الموقع لا يدعم العرض في iframe',
      'خطأ في الشبكة - جاري إعادة المحاولة',
      'الموقع غير متاح مؤقتاً',
      'مشكلة في سياسات الأمان للموقع'
    ];
    
    setCurrentErrorMessage(errorMessages[Math.min(retryCount, errorMessages.length - 1)]);
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
    <div className="w-full h-screen overflow-hidden bg-black relative">
      {/* Enhanced Loading indicator */}
      {(iframeLoading && currentWebsite) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">
              {retryCount > 0 ? `إعادة المحاولة ${retryCount}/3...` : 'جاري تحميل الموقع...'}
            </p>
            <p className="text-sm text-gray-300 mt-2">{currentWebsite.website_url}</p>
          </div>
        </div>
      )}

      {/* Enhanced Error indicator */}
      {(iframeError && currentWebsite) && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 z-10">
          <div className="text-center text-white max-w-md mx-4">
            <div className="w-16 h-16 bg-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg mb-2">
              {currentErrorMessage || 'فشل في تحميل الموقع'}
            </p>
            <p className="text-sm text-gray-300 mb-4">{currentWebsite.website_url}</p>
            
            {retryCount < 3 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">
                  جاري إعادة المحاولة ({retryCount}/3)...
                </p>
                <div className="w-full bg-red-800 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((retryCount + 1) / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">
                  تم تخطي هذا الموقع - الانتقال للموقع التالي...
                </p>
                <button 
                  onClick={retryCurrentWebsite}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-sm transition-colors"
                >
                  إعادة المحاولة يدوياً
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {!hasActiveWebsites ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-xl font-semibold mb-2">
              مرحباً بك في {account?.name}
            </h2>
            <p className="text-gray-300">لا توجد مواقع نشطة حالياً</p>
            <p className="text-sm text-gray-400 mt-2">
              ⚡ التحديث السريع مُفعّل (1 ثانية)
            </p>
          </div>
        </div>
      ) : currentWebsite ? (
        <iframe
          key={`${currentWebsiteIndex}-${retryCount}`}
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
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-modals allow-top-navigation allow-downloads allow-pointer-lock"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen; picture-in-picture; autoplay; encrypted-media; accelerometer; gyroscope; camera; microphone; geolocation; payment; display-capture"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      ) : null}

      {/* News Ticker Display */}
      {account?.id && !subscriptionExpired && (
        <NewsTickerDisplay accountId={account.id} />
      )}

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

      {/* Enhanced debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 left-0 bg-black bg-opacity-75 text-white text-xs p-2 z-50">
          <div>🔄 النقل: كل 3 ثوان</div>
          <div>📱 الجهاز: {isMobile ? 'موبايل' : 'ديسكتوب'}</div>
          <div>✅ المواقع النشطة: {websites.length}</div>
          <div>📍 الموقع الحالي: {currentWebsiteIndex + 1}</div>
          <div>⏳ حالة التحميل: {iframeLoading ? 'جاري التحميل' : 'مكتمل'}</div>
          <div>❌ خطأ: {iframeError ? 'نعم' : 'لا'}</div>
          <div>🔄 المحاولات: {retryCount}/3</div>
          <div>🚫 المواقع الفاشلة: {failedWebsites.size}</div>
          <div>👁️ النافذة: {isWindowFocused ? 'مُركزة' : 'غير مُركزة'}</div>
        </div>
      )}
    </div>
  );
};

export default ClientPublicPage;
