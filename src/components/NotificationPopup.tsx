
import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 100);

    // Auto close after display duration
    if (notification.display_duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.display_duration);

      return () => clearTimeout(timer);
    }
  }, [notification.display_duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Wait for animation to complete
  };

  const getPositionClasses = () => {
    switch (notification.position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getSizeClasses = () => {
    // إذا كان الموضع في المنتصف، اجعل الإشعار كبيراً جداً
    if (notification.position === 'center') {
      return 'w-[90vw] max-w-4xl min-h-[60vh]';
    }
    // للمواضع الأخرى، استخدم الحجم العادي
    return 'max-w-md min-w-80';
  };

  return (
    <div
      className={`fixed z-[9999] ${getPositionClasses()} transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ 
        ...(notification.position !== 'center' && { maxWidth: '400px', minWidth: '300px' })
      }}
    >
      <Card className={`shadow-2xl border-2 bg-white ${getSizeClasses()}`}>
        <CardContent className={`${notification.position === 'center' ? 'p-8' : 'p-4'}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className={`font-bold text-gray-900 flex-1 ${
              notification.position === 'center' ? 'text-3xl' : 'text-lg'
            }`}>
              {notification.title}
            </h3>
            <Button
              variant="ghost"
              size={notification.position === 'center' ? 'default' : 'sm'}
              onClick={handleClose}
              className={`hover:bg-gray-100 ${
                notification.position === 'center' ? 'h-10 w-10' : 'h-6 w-6 p-0'
              }`}
            >
              <X className={notification.position === 'center' ? 'h-6 w-6' : 'h-4 w-4'} />
            </Button>
          </div>

          {notification.image_url && (
            <div className={notification.position === 'center' ? 'mb-6' : 'mb-3'}>
              <img
                src={notification.image_url}
                alt={notification.title}
                className={`w-full object-cover rounded-lg ${
                  notification.position === 'center' ? 'h-64' : 'h-32'
                }`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {notification.message && (
            <p className={`text-gray-700 leading-relaxed ${
              notification.position === 'center' 
                ? 'text-xl mb-6' 
                : 'text-sm mb-3'
            }`}>
              {notification.message}
            </p>
          )}

          <div className="flex justify-end">
            <Button 
              size={notification.position === 'center' ? 'default' : 'sm'} 
              onClick={handleClose} 
              variant="outline"
              className={notification.position === 'center' ? 'text-lg px-6 py-3' : ''}
            >
              إغلاق
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPopup;
