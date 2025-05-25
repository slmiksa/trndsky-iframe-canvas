
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
  rotation_interval: number;
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
  const [rotationInterval, setRotationInterval] = useState(30); // Default 30 seconds

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

  // Function to fetch websites - now fetches all websites and filters active ones in state
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
      } else {
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
        
        // Set rotation interval from account data
        setRotationInterval(accountData.rotation_interval || 30);
        
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
  }, [account?.id, subscriptionExpired]);

  // Setup realtime listener for website changes
  useEffect(() => {
    if (!account?.id || subscriptionExpired) {
      console.log('⏭️ Skipping realtime setup - no account or subscription expired');
      return;
    }

    console.log('🔄 Setting up realtime listener for websites');
    console.log('🔄 Account ID:', account.id);
    
    // Create a unique channel name
    const channelName = `account-websites-${account.id}`;
    
    const channel = supabase
      .channel(channelName, {
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
          console.log('🔄 Website change detected:', payload);
          console.log('🔄 Event type:', payload.eventType);
          console.log('🔄 New record:', payload.new);
          console.log('🔄 Old record:', payload.old);
          console.log('🔄 Timestamp:', new Date().toISOString());
          
          // Force re-fetch websites to get the latest data
          console.log('🔄 Re-fetching websites due to change...');
          fetchWebsites(account);
        }
      )
      .subscribe((status) => {
        console.log('🔄 Realtime subscription status:', status);
        console.log('🔄 Channel name:', channelName);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to realtime updates');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Realtime subscription timed out');
        }
      });

    return () => {
      console.log('🔄 Cleaning up realtime listener');
      console.log('🔄 Removing channel:', channelName);
      supabase.removeChannel(channel);
    };
  }, [account?.id, subscriptionExpired]);

  // Initial fetch and realtime listener for notifications - IMPROVED VERSION
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

    // Fetch initial notifications
    fetchAndSetNotifications();

    // Setup realtime listener for notifications
    const notificationChannelName = `notifications-${account.id}`;
    
    const notificationChannel = supabase
      .channel(notificationChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `account_id=eq.${account.id}`
        },
        async (payload) => {
          console.log('🔔 Notification change detected:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new?.is_active) {
            // Add new active notification
            console.log('➕ Adding new notification:', payload.new);
            setActiveNotifications(prev => [...prev, payload.new as Notification]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            console.log('🔄 Updating notification:', updatedNotification);
            
            if (updatedNotification.is_active) {
              // Update existing or add if not exists
              setActiveNotifications(prev => {
                const exists = prev.find(n => n.id === updatedNotification.id);
                if (exists) {
                  return prev.map(n => n.id === updatedNotification.id ? updatedNotification : n);
                } else {
                  return [...prev, updatedNotification];
                }
              });
            } else {
              // Remove deactivated notification
              console.log('❌ Removing deactivated notification:', updatedNotification.id);
              setActiveNotifications(prev => prev.filter(n => n.id !== updatedNotification.id));
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted notification
            console.log('🗑️ Removing deleted notification:', payload.old?.id);
            setActiveNotifications(prev => prev.filter(n => n.id !== payload.old?.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Notification realtime subscription status:', status);
      });

    return () => {
      console.log('🔔 Cleaning up notification realtime listener');
      supabase.removeChannel(notificationChannel);
    };
  }, [account?.id, fetchActiveNotifications, subscriptionExpired]);

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
    const timerInterval = setInterval(checkTimers, 10000); // Check every 10 seconds

    return () => clearInterval(timerInterval);
  }, [account?.id, fetchActiveTimers, subscriptionExpired]);

  // Website rotation - now uses dynamic rotation interval
  useEffect(() => {
    if (websites.length <= 1 || subscriptionExpired) return;

    console.log('🔄 Setting up website rotation with interval:', rotationInterval, 'seconds');

    const interval = setInterval(() => {
      setCurrentWebsiteIndex((prev) => (prev + 1) % websites.length);
    }, rotationInterval * 1000); // Convert seconds to milliseconds

    return () => clearInterval(interval);
  }, [websites.length, subscriptionExpired, rotationInterval]);

  // Modified to only track that we've seen this notification, but don't remove it
  const handleNotificationClose = (notificationId: string) => {
    console.log('👋 User closed notification:', notificationId);
    setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
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
                مرحباً بك في {account.name}
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
              src={currentWebsite.website_url}
              title={currentWebsite.website_title || currentWebsite.website_url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
            />
          </div>
        ) : null}
      </main>

      {/* Active Notifications - Now properly managed with realtime updates */}
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
    </div>
  );
};

export default ClientPublicPage;
