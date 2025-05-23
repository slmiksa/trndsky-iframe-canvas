
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, AlertTriangle } from 'lucide-react';

interface BreakTimer {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  position: string;
}

interface BreakTimerDisplayProps {
  timer: BreakTimer;
  onClose: () => void;
}

const BreakTimerDisplay: React.FC<BreakTimerDisplayProps> = ({ timer, onClose }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isWarning, setIsWarning] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      
      // Parse end time
      const [endHours, endMinutes] = timer.end_time.split(':').map(Number);
      const endTimeSeconds = endHours * 3600 + endMinutes * 60;
      
      let remaining = endTimeSeconds - currentTime;
      
      // If negative, timer has ended
      if (remaining <= 0) {
        setTimeRemaining(0);
        return;
      }
      
      setTimeRemaining(remaining);
      
      // Warning in last 5 minutes (300 seconds)
      setIsWarning(remaining <= 300);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [timer.end_time]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPositionClasses = () => {
    switch (timer.position) {
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
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  const getSizeClasses = () => {
    if (timer.position === 'center') {
      return 'w-[85vw] max-w-2xl min-h-[50vh]';
    }
    return 'max-w-sm min-w-80';
  };

  const getCardStyles = () => {
    if (isWarning) {
      return {
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        border: '3px solid #ef4444',
        boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)',
      };
    }
    
    if (timer.position === 'center') {
      return {
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '3px solid #e2e8f0',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)',
      };
    }
    return {};
  };

  // Don't show if time is up
  if (timeRemaining <= 0) {
    return null;
  }

  return (
    <div
      className={`fixed z-[9999] ${getPositionClasses()} transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <Card 
        className={`${getSizeClasses()} rounded-2xl overflow-hidden ${
          isWarning ? 'animate-pulse' : ''
        }`}
        style={getCardStyles()}
      >
        <CardContent className={`relative text-center ${
          timer.position === 'center' ? 'p-12' : 'p-6'
        }`}>
          {/* العنوان */}
          <div className={`mb-6 flex items-center justify-center gap-3`}>
            <Clock className={`${timer.position === 'center' ? 'h-8 w-8' : 'h-6 w-6'} ${
              isWarning ? 'text-red-500' : 'text-blue-500'
            }`} />
            <h3 className={`font-bold ${isWarning ? 'text-red-600' : 'text-gray-900'} ${
              timer.position === 'center' ? 'text-3xl' : 'text-xl'
            }`}>
              {timer.title}
            </h3>
          </div>

          {/* رسالة التحذير */}
          {isWarning && (
            <div className="mb-6 flex items-center justify-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p className={`font-semibold ${
                timer.position === 'center' ? 'text-lg' : 'text-sm'
              }`}>
                وقت البريك على وشك الانتهاء!
              </p>
            </div>
          )}

          {/* الساعة التنازلية */}
          <div className={`${timer.position === 'center' ? 'mb-8' : 'mb-4'}`}>
            <div className={`inline-flex items-center justify-center ${
              timer.position === 'center' ? 'w-64 h-64' : 'w-40 h-40'
            } rounded-full border-8 ${
              isWarning ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'
            } transition-colors duration-300`}>
              <span className={`font-mono font-bold ${
                isWarning ? 'text-red-600' : 'text-blue-600'
              } ${timer.position === 'center' ? 'text-4xl' : 'text-2xl'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className={`text-gray-600 ${
            timer.position === 'center' ? 'text-lg' : 'text-sm'
          }`}>
            <p>ينتهي في الساعة {timer.end_time.slice(0, 5)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BreakTimerDisplay;
