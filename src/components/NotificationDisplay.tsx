
import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface Notification {
  id: string;
  account_id: string;
  title: string;
  message?: string | null;
  image_url?: string | null;
  position: string;
  display_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branch_id?: string | null;
}

interface NotificationDisplayProps {
  accountId: string;
  branchId?: string | null;
  onActivityChange: (isActive: boolean) => void;
}

const NotificationDisplay: React.FC<NotificationDisplayProps> = ({ 
  accountId, 
  branchId, 
  onActivityChange 
}) => {
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [displayedNotification, setDisplayedNotification] = useState<Notification | null>(null);
  const { fetchActiveNotifications } = useNotifications(accountId, branchId);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    try {
      console.log('📢 Fetching active notifications for account:', accountId, 'branch:', branchId);
      
      const notifications = await fetchActiveNotifications(accountId, branchId);
      console.log('📢 Active notifications found:', notifications.length);
      
      setActiveNotifications(notifications);
      const hasActive = notifications.length > 0;
      onActivityChange(hasActive);
      
      // Start showing notifications if any exist
      if (notifications.length > 0 && !displayedNotification) {
        showNextNotification(notifications);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      onActivityChange(false);
    }
  };

  const showNextNotification = (notifications: Notification[]) => {
    if (notifications.length === 0) {
      setDisplayedNotification(null);
      return;
    }

    // Get next notification (rotate through them)
    const currentIndex = displayedNotification 
      ? notifications.findIndex(n => n.id === displayedNotification.id)
      : -1;
    const nextIndex = (currentIndex + 1) % notifications.length;
    const nextNotification = notifications[nextIndex];

    console.log('📢 Showing notification:', nextNotification.title);
    setDisplayedNotification(nextNotification);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Hide notification after display duration
    timeoutRef.current = setTimeout(() => {
      setDisplayedNotification(null);
      
      // Show next notification after a brief pause
      setTimeout(() => {
        showNextNotification(notifications);
      }, 2000); // 2 second pause between notifications
    }, nextNotification.display_duration * 1000);
  };

  useEffect(() => {
    if (!accountId) return;

    fetchNotifications();

    // Set up polling for new notifications
    intervalRef.current = setInterval(fetchNotifications, 10000); // Poll every 10s

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [accountId, branchId]);

  useEffect(() => {
    // Update displayed notifications when active notifications change
    if (activeNotifications.length > 0) {
      showNextNotification(activeNotifications);
    } else {
      setDisplayedNotification(null);
    }
  }, [activeNotifications]);

  if (!displayedNotification) {
    return null;
  }

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-right':
        return 'top-8 right-8';
      case 'top-left':
        return 'top-8 left-8';
      case 'bottom-right':
        return 'bottom-8 right-8';
      case 'bottom-left':
        return 'bottom-8 left-8';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-8 right-8';
    }
  };

  return (
    <div 
      className={`fixed z-40 ${getPositionClasses(displayedNotification.position)} max-w-sm`}
    >
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-start gap-3">
          {displayedNotification.image_url && (
            <img 
              src={displayedNotification.image_url} 
              alt="" 
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {displayedNotification.title}
            </h3>
            {displayedNotification.message && (
              <p className="text-sm text-gray-600">
                {displayedNotification.message}
              </p>
            )}
          </div>
        </div>
        
        {branchId && (
          <div className="mt-2 text-xs text-blue-600">
            فرع: {branchId}
          </div>
        )}
        
        {!branchId && (
          <div className="mt-2 text-xs text-green-600">
            الحساب الرئيسي
          </div>
        )}
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-400">
            مدة العرض: {displayedNotification.display_duration}ث | الموقع: {displayedNotification.position}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDisplay;
