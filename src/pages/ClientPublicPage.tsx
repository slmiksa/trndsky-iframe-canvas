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
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [activeTimers, setActiveTimers] = useState<BreakTimer[]>([]);
  const [processedNotifications, setProcessedNotifications] = useState<Set<string>>(new Set());
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

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

  // Function to fetch websites with better error handling
  const fetchWebsites = async (accountData: Account) => {
    try {
      console.log('🔍 Fetching websites for account:', accountData.id);
      
      const { data: websiteData, error: websiteError } = await supabase
        .from('account_websites')
        .select('*')
        .eq('account_id', accountData.id)
        .order('created_at', { ascending: true });

      if (websiteError) {
        console.error('❌ Error fetching websites:', websiteError);
        throw websiteError;
      }

      console.log('✅ All websites data fetched:', websiteData);
      
      // Filter only active websites
      const activeWebsites = (websiteData || []).filter(website => website.is_active);
      console.log('✅ Active websites filtered:', activeWebsites);
      
      setWebsites(activeWebsites);
      
      // Reset current website index if needed
      if (activeWebsites && activeWebsites.length > 0) {
        setCurrentWebsiteIndex(prev => prev >= activeWebsites.length ? 0 : prev);
      } else {
        setCurrentWebsiteIndex(0);
        console.log('⚠️ No active websites found');
      }
    } catch (error) {
      console.error('❌ Error in fetchWebsites:', error);
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
        console.log('🔍 Fetching account data for:', accountId);
        
        // أولاً نحاول البحث بالـ ID
        let { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', accountId)
          .eq('status', 'active')
          .single();

        // إذا لم نجد شيئاً، نبحث بالاسم
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
        console.error('❌ Error in fetchAccountData:', error);
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId]);

  // Enhanced realtime listener for immediate updates
  useEffect(() => {
    if (!account?.id || subscriptionExpired) {
      console.log('⏭️ Skipping realtime setup - no account or subscription expired');
      return;
    }

    console.log('🔄 Setting up enhanced realtime listener for websites');
    console.log('🔄 Account ID:', account.id);
    
    // Create multiple channels for better reliability
    const channels = [];
    
    // Primary channel for website updates
    const websiteChannel = supabase
      .channel(`websites-${account.id}-${Date.now()}`, {
        config: {
          broadcast: { self: true },
          presence: { key: account.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_websites',
          filter: `account_id=eq.${account.id}`
        },
        (payload) => {
          console.log('🔄 Website realtime update detected:', payload);
          console.log('🔄 Event type:', payload.eventType);
          console.log('🔄 New record:', payload.new);
          console.log('🔄 Old record:', payload.old);
          console.log('🔄 Timestamp:', new Date().toISOString());
          
          // Immediate update with a small delay to ensure data consistency
          setTimeout(() => {
            console.log('🔄 Fetching updated websites...');
            fetchWebsites(account);
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('🔄 Website channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to website updates!');
        }
      });

    channels.push(websiteChannel);

    // Channel for notification updates
    const notificationChannel = supabase
      .channel(`notifications-${account.id}-${Date.now()}`, {
        config: {
          broadcast: { self: true },
          presence: { key: account.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `account_id=eq.${account.id}`
        },
        (payload) => {
          console.log('🔄 Notification realtime update detected:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            
            // إذا تم إيقاف الإشعار، أزله من القائمة المعروضة
            if (!updatedNotification.is_active) {
              console.log('🔄 Removing notification from display:', updatedNotification.id);
              setVisibleNotifications(prev => 
                prev.filter(n => n.id !== updatedNotification.id)
              );
            }
            // إذا تم تفعيل الإشعار ولم يتم عرضه مسبقاً
            else if (updatedNotification.is_active && !processedNotifications.has(updatedNotification.id)) {
              console.log('🔄 Adding new notification to display:', updatedNotification.id);
              setVisibleNotifications(prev => [...prev, updatedNotification]);
              setProcessedNotifications(prev => new Set([...prev, updatedNotification.id]));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 Notification channel status:', status);
      });

    channels.push(notificationChannel);

    // Secondary polling as fallback
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for updates (fallback)');
      fetchWebsites(account);
    }, 5000); // Poll every 5 seconds as backup

    return () => {
      console.log('🔄 Cleaning up realtime listeners and polling');
      channels.forEach(channel => supabase.removeChannel(channel));
      clearInterval(pollInterval);
    };
  }, [account?.id, subscriptionExpired, processedNotifications]);

  // Check for active notifications (only on initial load)
  useEffect(() => {
    const checkNotifications = async () => {
      if (!account?.id || subscriptionExpired) return;

      try {
        console.log('🔍 Checking for active notifications...');
        const notifications = await fetchActiveNotifications(account.id);
        
        // فقط عرض الإشعارات النشطة التي لم يتم عرضها مسبقاً
        const newNotifications = notifications.filter(
          notification => notification.is_active && !processedNotifications.has(notification.id)
        );
        
        if (newNotifications.length > 0) {
          console.log('✅ Found new active notifications:', newNotifications.length);
          setVisibleNotifications(newNotifications);
          
          // إضافة معرفات الإشعارات الجديدة للمعالجة
          const newProcessedIds = new Set([...processedNotifications, ...newNotifications.map(n => n.id)]);
          setProcessedNotifications(newProcessedIds);
        }
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
      }
    };

    // فقط في التحميل الأولي
    if (account?.id && !subscriptionExpired && processedNotifications.size === 0) {
      checkNotifications();
    }
  }, [account?.id, subscriptionExpired]);

  // Check for active timers
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

    return () => clearInterval(timerInterval);
  }, [account?.id, fetchActiveTimers, subscriptionExpired]);

  // Website rotation
  useEffect(() => {
    if (websites.length <= 1 || subscriptionExpired) return;

    const interval = setInterval(() => {
      setCurrentWebsiteIndex((prev) => (prev + 1) % websites.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [websites.length, subscriptionExpired]);

  const handleNotificationClose = (notificationId: string) => {
    console.log('🔄 User closed notification:', notificationId);
    setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleTimerClose = (timerId: string) => {
    setActiveTimers(prev => prev.filter(t => t.id !== timerId));
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content - Full Screen */}
      <main className="flex-1">
        {websites.length === 0 ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                مرحباً بك في {account?.name}
              </h2>
              <p className="text-gray-600">لا توجد مواقع نشطة حالياً</p>
              <p className="text-sm text-gray-400 mt-2">
                🔄 الاستماع للتحديثات المباشرة نشط
              </p>
            </div>
          </div>
        ) : currentWebsite ? (
          <div className="h-screen">
            <iframe
              key={`${currentWebsite.id}-${currentWebsite.is_active}-${Date.now()}`}
              src={currentWebsite.website_url}
              title={currentWebsite.website_title || currentWebsite.website_url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
            />
          </div>
        ) : null}
      </main>

      {/* Active Notifications */}
      {visibleNotifications.map((notification) => (
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
    </div>
  );
};

export default ClientPublicPage;
