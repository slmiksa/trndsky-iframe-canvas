import React from 'react';
import { Monitor, Wifi, Radio, Settings, Smartphone, Tv, Volume2, Cast } from 'lucide-react';

const AnimatedBackground = () => {
  const icons = [
    { Icon: Monitor, delay: '0s' },
    { Icon: Wifi, delay: '2s' },
    { Icon: Radio, delay: '4s' },
    { Icon: Settings, delay: '6s' },
    { Icon: Smartphone, delay: '8s' },
    { Icon: Tv, delay: '10s' },
    { Icon: Volume2, delay: '12s' },
    { Icon: Cast, delay: '14s' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* طبقة التدرج للخلفية */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900/20"></div>
      
      {/* الرموز المتحركة */}
      {icons.map(({ Icon, delay }, index) => (
        <div
          key={index}
          className="absolute opacity-10 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: delay,
            animationDuration: '20s',
          }}
        >
          <Icon size={60} className="text-white" />
        </div>
      ))}
      
      {/* دوائر متحركة إضافية */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-32 right-20 w-24 h-24 bg-purple-500/10 rounded-full animate-bounce"></div>
      <div className="absolute top-1/3 right-10 w-16 h-16 bg-blue-400/10 rounded-full animate-ping"></div>
      
      {/* خطوط متحركة */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-500/20 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
    </div>
  );
};

export default AnimatedBackground;