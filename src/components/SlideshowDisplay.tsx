
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { debounce, performanceMonitor } from '@/utils/performanceOptimization';

interface Slideshow {
  id: string;
  title: string;
  images: string[];
  interval_seconds: number;
  is_active: boolean;
}

interface SlideshowDisplayProps {
  accountId: string;
  onActivityChange: (isActive: boolean) => void;
}

const SlideshowDisplay: React.FC<SlideshowDisplayProps> = ({ accountId, onActivityChange }) => {
  const [activeSlideshow, setActiveSlideshow] = useState<Slideshow | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const imageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const isActiveRef = useRef(false);

  const isLargeScreen = window.innerWidth >= 1200 || window.screen.width >= 1200;

  // تحسين دالة التحميل مع مراقبة الأداء
  const fetchActiveSlideshow = useCallback(async () => {
    try {
      performanceMonitor.start('slideshow-fetch');
      console.log('🎬 Fetching active slideshow for:', accountId);
      
      const { data, error } = await supabase.rpc('get_all_slideshows_for_account', {
        p_account_id: accountId
      });

      if (error && error.code !== 'PGRST116') throw error;

      // Logic change: Only ever use the FIRST active slideshow. This disables rotation.
      const firstActiveSlide = data?.find(slide => slide.is_active) || null;
      const hasActive = !!firstActiveSlide;

      if (isActiveRef.current !== hasActive) {
        onActivityChange(hasActive);
        isActiveRef.current = hasActive;
        console.log(`🎬 Slideshow activity state changed to: ${hasActive}`);
      }

      const getSlideshowSignature = (slide: Slideshow | null) => {
        if (!slide) return 'no-active-slides';
        return `${slide.id}:${slide.images.join(',')}`;
      };

      setActiveSlideshow(prevSlideshow => {
        const prevSignature = getSlideshowSignature(prevSlideshow);
        const newSignature = getSlideshowSignature(firstActiveSlide);

        if (prevSignature === newSignature) {
          console.log('✅ Slideshow content is identical, no update needed.');
          return prevSlideshow;
        }
        
        console.log('🔄 Slideshow has changed, resetting to initial state.');
        setImageIndex(0);
        return firstActiveSlide;
      });

      setConnectionError(false);
      performanceMonitor.end('slideshow-fetch');
    } catch (error) {
      console.error('❌ Error fetching slideshow:', error);
      setConnectionError(true);
      if (isActiveRef.current) {
        onActivityChange(false);
        isActiveRef.current = false;
      }
      setActiveSlideshow(null);
      performanceMonitor.end('slideshow-fetch');
    } finally {
      if (loading) setLoading(false);
    }
  }, [accountId, onActivityChange, loading]);

  // إنشاء نسخة محسنة من دالة التحميل
  const debouncedFetch = useCallback(
    debounce(fetchActiveSlideshow, 500),
    [fetchActiveSlideshow]
  );

  // Realtime listener and polling - محسن للأداء
  useEffect(() => {
    if (!accountId) return;

    console.log('📡 SlideshowDisplay: Setting up optimized listeners for:', accountId);
    
    let isActive = true; // flag لمنع تحديثات غير ضرورية
    
    fetchActiveSlideshow(); // Initial fetch
    
    const channel = supabase
      .channel(`slideshow-display-${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_slideshows',
          filter: `account_id=eq.${accountId}`
        },
        async () => {
          if (isActive) {
            console.log('📡 Slideshow change detected, re-fetching.');
            debouncedFetch();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // تقليل التكرار من كل 10 ثواني إلى كل 30 ثانية لتحسين الأداء
    const backupInterval = setInterval(() => {
      if (isActive) {
        debouncedFetch();
      }
    }, 30000);

    return () => {
      isActive = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      clearInterval(backupInterval);
    };
  }, [accountId, onActivityChange]);

  const clearAllTimers = () => {
    if (imageIntervalRef.current) {
      clearInterval(imageIntervalRef.current);
      imageIntervalRef.current = null;
    }
  };

  // Image rotation within the current slideshow
  useEffect(() => {
    clearAllTimers();

    if (!activeSlideshow || activeSlideshow.images.length <= 1 || loading) {
      return;
    }

    console.log('🎬 Starting image rotation for slideshow:', {
      title: activeSlideshow.title,
      imagesCount: activeSlideshow.images.length,
      intervalSeconds: 15
    });

    imageIntervalRef.current = setInterval(() => {
      setImageIndex(prevIndex => {
        const nextImageIndex = (prevIndex + 1) % activeSlideshow.images.length;
        console.log(`🔄 Image transition: ${prevIndex + 1} -> ${nextImageIndex + 1} (total: ${activeSlideshow.images.length}) in slideshow ${activeSlideshow.title}`);
        return nextImageIndex;
      });
    }, 15000);

    return () => clearAllTimers();
  }, [activeSlideshow, loading]);

  // Preload next image for smooth transition
  useEffect(() => {
    if (!activeSlideshow || loading) return;

    try {
      if (activeSlideshow.images.length > 1) {
        const nextImageIndex = (imageIndex + 1) % activeSlideshow.images.length;
        const nextImageUrl = activeSlideshow.images[nextImageIndex];
        if (nextImageUrl) {
          const img = new Image();
          img.src = nextImageUrl;
          console.log(`🖼️ Preloading next image: ${nextImageUrl}`);
        }
      }
    } catch (error) {
      console.error("🔥 Error during image preloading:", error);
    }
  }, [activeSlideshow, imageIndex, loading]);


  // Clean up timers on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">جاري تحميل العرض التقديمي...</p>
          {connectionError && (
            <p className="text-sm text-red-300 mt-2">مشكلة في الاتصال - جاري إعادة المحاولة</p>
          )}
        </div>
      </div>
    );
  }

  if (!activeSlideshow || activeSlideshow.images.length === 0) {
    return null;
  }

  const safeImageIndex = Math.max(0, Math.min(imageIndex, activeSlideshow.images.length - 1));
  const currentImage = activeSlideshow.images[safeImageIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full relative overflow-hidden">
        <div className="w-full h-full">
          <img 
            key={`${activeSlideshow.id}-${safeImageIndex}`}
            src={currentImage}
            alt={`${activeSlideshow.title} - Slide ${safeImageIndex + 1}`}
            className="w-full h-full object-contain bg-black"
            style={{
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            onLoad={() => console.log('✅ Image loaded:', safeImageIndex + 1, 'of', activeSlideshow.images.length, currentImage)}
            onError={(e) => {
              console.error('❌ Image failed to load:', safeImageIndex + 1, currentImage);
              console.error('Error details:', e);
            }}
          />
        </div>
        
        {activeSlideshow.images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
            {activeSlideshow.images.map((_, index) => (
              <div 
                key={index} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === safeImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                }`} 
              />
            ))}
          </div>
        )}

        <div className="absolute top-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <h2 className="text-white text-xl font-semibold">{activeSlideshow.title}</h2>
          <div className="text-white/80 text-sm">
            <p>الصورة {safeImageIndex + 1} من {activeSlideshow.images.length}</p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-linear"
            style={{
              width: `${((safeImageIndex + 1) / activeSlideshow.images.length) * 100}%`
            }}
          />
        </div>


        {process.env.NODE_ENV === 'development' && activeSlideshow && (
          <div className="absolute bottom-16 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs">
            <div>Image: {safeImageIndex + 1}/{activeSlideshow.images.length}</div>
            <div>Title: {activeSlideshow.title}</div>
            <div>صور كل: 15 ثانية</div>
            <div>Image Timer: {imageIntervalRef.current ? 'نشط' : 'متوقف'}</div>
            <div>Active Slideshow: {activeSlideshow ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideshowDisplay;
