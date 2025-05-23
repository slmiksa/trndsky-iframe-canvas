
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
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());

  const { fetchActiveNotifications } = useNotifications();
  const { fetchActiveTimers } = useBreakTimers();

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
        setAccount(accountData);

        const { data: websiteData, error: websiteError } = await supabase
          .from('account_websites')
          .select('*')
          .eq('account_id', accountData.id)
          .eq('is_active', true);

        if (websiteError) {
          console.error('❌ Error fetching websites:', websiteError);
        } else {
          console.log('✅ Websites data fetched:', websiteData);
          setWebsites(websiteData || []);
        }

      } catch (error) {
        console.error('❌ Error in fetchAccountData:', error);
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId]);

  // Check for active notifications - modify this to not auto-dismiss
  useEffect(() => {
    const checkNotifications = async () => {
      if (!account?.id) return;

      try {
        const notifications = await fetchActiveNotifications(account.id);
        
        // Only add notifications that aren't already shown
        const newNotifications = notifications.filter(
          notification => !Array.from(shownNotifications).includes(notification.id)
        );
        
        if (newNotifications.length > 0) {
          setActiveNotifications(prev => [...prev, ...newNotifications]);
        }
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
      }
    };

    checkNotifications();
    const notificationInterval = setInterval(checkNotifications, 30000); // Check every 30 seconds

    return () => clearInterval(notificationInterval);
  }, [account?.id, fetchActiveNotifications, shownNotifications]);

  // Check for active timers
  useEffect(() => {
    const checkTimers = async () => {
      if (!account?.id) return;

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
  }, [account?.id, fetchActiveTimers]);

  // Website rotation
  useEffect(() => {
    if (websites.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentWebsiteIndex((prev) => (prev + 1) % websites.length);
    }, 30000); // Switch every 30 seconds

    return () => clearInterval(interval);
  }, [websites.length]);

  // Modified to only track that we've seen this notification, but don't remove it
  const handleNotificationClose = (notificationId: string) => {
    setShownNotifications(prev => new Set([...prev, notificationId]));
    // We don't remove from activeNotifications anymore - they stay visible
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
              <p className="text-gray-600">لا توجد مواقع مُعرّفة حالياً</p>
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

      {/* Active Notifications - modify to show all active */}
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
