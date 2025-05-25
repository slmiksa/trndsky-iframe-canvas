import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useBreakTimers } from '@/hooks/useBreakTimers';
import { useAccountData } from '@/hooks/useAccountData';
import { useVisitorRealtimeUpdates } from '@/hooks/useVisitorRealtimeUpdates';
import NotificationPopup from '@/components/NotificationPopup';
import BreakTimerDisplay from '@/components/BreakTimerDisplay';
import SubscriptionExpiredView from '@/components/SubscriptionExpiredView';
import LoadingView from '@/components/LoadingView';
import ErrorView from '@/components/ErrorView';
import ClientPageContent from '@/components/ClientPageContent';
import { supabase } from '@/integrations/supabase/client';

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
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [activeTimers, setActiveTimers] = useState<BreakTimer[]>([]);

  const {
    account,
    websites,
    loading,
    error,
    subscriptionExpired,
    rotationInterval,
    setRotationInterval,
    setAccount,
    fetchWebsites
  } = useAccountData(accountId);

  // إعداد التحديثات الفورية للزائر
  useVisitorRealtimeUpdates({
    account,
    fetchWebsites,
    setRotationInterval,
    setAccount
  });

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

  // Initial fetch and realtime listener for notifications
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
            console.log('➕ Adding new notification:', payload.new);
            setActiveNotifications(prev => [...prev, payload.new as Notification]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            console.log('🔄 Updating notification:', updatedNotification);
            
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
              console.log('❌ Removing deactivated notification:', updatedNotification.id);
              setActiveNotifications(prev => prev.filter(n => n.id !== updatedNotification.id));
            }
          } else if (payload.eventType === 'DELETE') {
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
    const timerInterval = setInterval(checkTimers, 10000);

    return () => clearInterval(timerInterval);
  }, [account?.id, fetchActiveTimers, subscriptionExpired]);

  const handleNotificationClose = (notificationId: string) => {
    console.log('👋 User closed notification:', notificationId);
    setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleTimerClose = (timerId: string) => {
    setActiveTimers(prev => prev.filter(t => t.id !== timerId));
  };

  if (loading) {
    return <LoadingView />;
  }

  if (error || !account) {
    return <ErrorView error={error} />;
  }

  if (subscriptionExpired) {
    return <SubscriptionExpiredView account={account} />;
  }

  return (
    <>
      <ClientPageContent 
        account={account}
        websites={websites}
        rotationInterval={rotationInterval}
      />

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
    </>
  );
};

export default ClientPublicPage;
