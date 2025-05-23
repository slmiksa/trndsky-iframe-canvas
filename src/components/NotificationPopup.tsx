
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
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div
      className={`fixed z-[9999] ${getPositionClasses()} transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ maxWidth: '400px', minWidth: '300px' }}
    >
      <Card className="shadow-2xl border-2 bg-white">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-gray-900 flex-1">{notification.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {notification.image_url && (
            <div className="mb-3">
              <img
                src={notification.image_url}
                alt={notification.title}
                className="w-full h-32 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {notification.message && (
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              {notification.message}
            </p>
          )}

          <div className="flex justify-end">
            <Button size="sm" onClick={handleClose} variant="outline">
              إغلاق
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPopup;
