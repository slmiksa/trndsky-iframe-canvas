
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string | null;
  image_url: string | null;
  position: string;
  display_duration: number;
}

interface NotificationPopupProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // تأكد من أن المكون مازال mounted
    if (!mountedRef.current) return;

    // Trigger animation after mount
    const showTimer = setTimeout(() => {
      if (mountedRef.current) {
        setIsVisible(true);
      }
    }, 100);

    // Auto close after display duration only if duration is set and greater than 0
    if (notification.display_duration > 0) {
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          handleClose();
        }
      }, notification.display_duration);
    }

    return () => {
      clearTimeout(showTimer);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [notification.display_duration]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClose = () => {
    if (!mountedRef.current) return;
    
    // منع إغلاقات متعددة
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsVisible(false);
    
    // انتظار انتهاء الأنيميشن قبل الإزالة الكاملة
    setTimeout(() => {
      if (mountedRef.current) {
        setShouldRender(false);
        onClose();
      }
    }, 300);
  };

  // عدم الرسم إذا تم تحديد عدم الرسم
  if (!shouldRender) {
    return null;
  }

  const getPositionClasses = () => {
    switch (notification.position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-20 left-4';
      case 'bottom-right':
        return 'bottom-20 right-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-20 left-1/2 -translate-x-1/2';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getSizeClasses = () => {
    if (notification.position === 'center') {
      return 'w-[85vw] max-w-7xl min-h-[80vh]';
    }
    return 'max-w-md min-w-80';
  };

  const getCardStyles = () => {
    if (notification.position === 'center') {
      return {
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '3px solid #e2e8f0',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)',
      };
    }
    return {};
  };

  return (
    <div
      className={`fixed z-[9999] ${getPositionClasses()} transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <Card 
        className={`${getSizeClasses()} rounded-2xl overflow-hidden relative`}
        style={getCardStyles()}
      >
        <CardContent className={`relative ${notification.position === 'center' ? 'p-12' : 'p-4'}`}>
          <button
            onClick={handleClose}
            className={`absolute ${notification.position === 'center' ? 'top-6 right-6' : 'top-2 right-2'} 
                      bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors duration-200 
                      z-10 shadow-sm`}
            aria-label="إغلاق الإشعار"
          >
            <X className={`${notification.position === 'center' ? 'h-6 w-6' : 'h-4 w-4'} text-gray-600`} />
          </button>

          <div className={notification.position === 'center' ? 'mb-8 pr-12' : 'mb-4 pr-8'}>
            <h3 className={`font-bold text-gray-900 ${
              notification.position === 'center' ? 'text-4xl text-center' : 'text-lg'
            }`}>
              {notification.title}
            </h3>
          </div>

          {notification.image_url && (
            <div className={`${notification.position === 'center' ? 'mb-8' : 'mb-4'} flex justify-center`}>
              <img
                src={notification.image_url}
                alt={notification.title}
                className={`rounded-xl shadow-lg ${
                  notification.position === 'center' 
                    ? 'w-[85%] max-h-[70vh] object-contain' 
                    : 'w-[85%] max-h-32 object-cover'
                }`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {notification.message && (
            <div className={`text-center`}>
              <p className={`text-gray-700 leading-relaxed whitespace-pre-line ${
                notification.position === 'center' 
                  ? 'text-2xl max-w-4xl mx-auto' 
                  : 'text-sm'
              }`}>
                {notification.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPopup;
