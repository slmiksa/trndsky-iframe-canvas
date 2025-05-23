
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
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getSizeClasses = () => {
    if (notification.position === 'center') {
      return 'w-[95vw] max-w-6xl min-h-[85vh]';
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
        className={`${getSizeClasses()} rounded-2xl overflow-hidden`}
        style={getCardStyles()}
      >
        <CardContent className={`relative ${notification.position === 'center' ? 'p-12' : 'p-4'}`}>
          {/* زر الإغلاق */}
          <Button
            variant="ghost"
            size={notification.position === 'center' ? 'default' : 'sm'}
            onClick={handleClose}
            className={`absolute top-4 right-4 z-10 hover:bg-gray-100/80 rounded-full ${
              notification.position === 'center' ? 'h-12 w-12' : 'h-8 w-8 p-0'
            }`}
          >
            <X className={notification.position === 'center' ? 'h-7 w-7' : 'h-4 w-4'} />
          </Button>

          {/* العنوان */}
          <div className={notification.position === 'center' ? 'mb-8' : 'mb-4'}>
            <h3 className={`font-bold text-gray-900 ${
              notification.position === 'center' ? 'text-4xl text-center' : 'text-lg'
            }`}>
              {notification.title}
            </h3>
          </div>

          {/* الصورة */}
          {notification.image_url && (
            <div className={`${notification.position === 'center' ? 'mb-8' : 'mb-4'} flex justify-center`}>
              <img
                src={notification.image_url}
                alt={notification.title}
                className={`rounded-xl shadow-lg ${
                  notification.position === 'center' 
                    ? 'max-w-full max-h-[40vh] w-auto h-auto object-contain' 
                    : 'w-full h-32 object-cover'
                }`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* الرسالة */}
          {notification.message && (
            <div className={`${notification.position === 'center' ? 'mb-12' : 'mb-4'} text-center`}>
              <p className={`text-gray-700 leading-relaxed ${
                notification.position === 'center' 
                  ? 'text-2xl max-w-4xl mx-auto' 
                  : 'text-sm'
              }`}>
                {notification.message}
              </p>
            </div>
          )}

          {/* منطقة المحتوى الإضافي */}
          {notification.position === 'center' && (
            <div className="bg-gray-50/50 rounded-xl p-8 mb-8 border border-gray-200/50">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <ImageIcon className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-600 text-lg">
                  يمكنك إضافة محتوى إضافي هنا
                </p>
              </div>
            </div>
          )}

          {/* أزرار التحكم للإشعارات الكبيرة فقط */}
          {notification.position === 'center' && (
            <div className="flex justify-center gap-4">
              <Button 
                onClick={handleClose} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                فهمت
              </Button>
            </div>
          )}

          {/* زر الإغلاق للإشعارات الصغيرة */}
          {notification.position !== 'center' && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleClose} variant="outline">
                إغلاق
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPopup;
