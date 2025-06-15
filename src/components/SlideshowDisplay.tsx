import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [activeSlideshows, setActiveSlideshows] = useState<Slideshow[]>([]);
  const [position, setPosition] = useState({ slideshow: 0, image: 0 });
  const [loading, setLoading] = useState(true); // Represents initial load only
  const [connectionError, setConnectionError] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(30);
  const imageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const slideshowRotationRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const isActiveRef = useRef(false);

  // Detect if running on TV/large screen
  const isLargeScreen = window.innerWidth >= 1200 || window.screen.width >= 1200;

  // جلب فترة التنقل من قاعدة البيانات
  const fetchRotationInterval = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('rotation_interval')
        .eq('id', accountId)
        .single();

      if (data && !error) {
        setRotationInterval(data.rotation_interval || 30);
        console.log('✅ Rotation interval fetched:', data.rotation_interval);
      }
    } catch (error) {
      console.error('❌ Error fetching rotation interval:', error);
    }
  };

  const fetchActiveSlideshows = async () => {
    try {
      console.log('🎬 Fetching active slideshows for:', accountId);
      
      const { data, error } = await supabase.rpc('get_all_slideshows_for_account', {
        p_account_id: accountId
      });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const newActiveSlides = data?.filter(slide => slide.is_active) || [];
      const hasActive = newActiveSlides.length > 0;

      // Only call back if activity status has changed to prevent unnecessary re-renders
      if (isActiveRef.current !== hasActive) {
        onActivityChange(hasActive);
        isActiveRef.current = hasActive;
        console.log(`🎬 Slideshow activity state changed to: ${hasActive}`);
      }

      const getSlideshowsSignature = (slides: Slideshow[]) => {
        if (!slides || slides.length === 0) return 'no-active-slides';
        return slides
          .map(s => `${s.id}:${s.images.join(',')}`) // Signature includes image list
          .sort() // Sort for order-independent comparison
          .join(';');
      };

      setActiveSlideshows(prevSlideshows => {
        const prevSignature = getSlideshowsSignature(prevSlideshows);
        const newSignature = getSlideshowsSignature(newActiveSlides);

        if (prevSignature === newSignature) {
          console.log('✅ Slideshow content is identical, no update needed.');
          return prevSlideshows;
        }
        
        console.log('🔄 Slideshow list or content has changed, resetting to initial state.');
        setPosition({ slideshow: 0, image: 0 });
        return newActiveSlides;
      });

      setConnectionError(false);
    } catch (error) {
      console.error('❌ Error fetching slideshows:', error);
      setConnectionError(true);
      // On error, ensure we report as inactive
      if (isActiveRef.current) {
        onActivityChange(false);
        isActiveRef.current = false;
      }
      setActiveSlideshows([]);
    } finally {
      // Only change loading state on the very first fetch
      if (loading) {
        setLoading(false);
      }
    }
  };

  // Realtime listener and polling
  useEffect(() => {
    if (!accountId) return;

    console.log('📡 SlideshowDisplay: Setting up internal listeners for:', accountId);
    
    fetchRotationInterval();
    fetchActiveSlideshows(); // Initial fetch
    
    const channel = supabase
      .channel(`slideshow-display-${accountId}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_slideshows',
          filter: `account_id=eq.${accountId}`
        },
        async (payload) => {
          console.log('📡 Slideshow change detected:', payload.eventType);
          await fetchActiveSlideshows();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'accounts',
          filter: `id=eq.${accountId}`
        },
        async (payload) => {
          console.log('📡 Account settings change detected');
          await fetchRotationInterval();
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Add a backup polling interval for resilience
    const backupInterval = setInterval(fetchActiveSlideshows, 10000); // Poll every 10s

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      clearInterval(backupInterval);
    };
  }, [accountId, onActivityChange]);

  // تنظيف جميع المؤقتات
  const clearAllTimers = () => {
    if (imageIntervalRef.current) {
      clearInterval(imageIntervalRef.current);
      imageIntervalRef.current = null;
    }
    if (slideshowRotationRef.current) {
      clearInterval(slideshowRotationRef.current);
      slideshowRotationRef.current = null;
    }
  };

  // التنقل بين الصور داخل السلايد شو الحالي
  useEffect(() => {
    if (imageIntervalRef.current) {
      clearInterval(imageIntervalRef.current);
      imageIntervalRef.current = null;
    }

    const currentSlideshow = activeSlideshows[position.slideshow];
    if (!currentSlideshow || currentSlideshow.images.length <= 1 || loading) {
      return;
    }

    console.log('🎬 Starting image rotation for slideshow:', {
      title: currentSlideshow.title,
      imagesCount: currentSlideshow.images.length,
      intervalSeconds: 15
    });

    // تنقل بين الصور كل 15 ثوانٍ
    imageIntervalRef.current = setInterval(() => {
      setPosition((prev) => {
        if (!activeSlideshows[prev.slideshow]) return prev;
        const nextImageIndex = (prev.image + 1) % activeSlideshows[prev.slideshow].images.length;
        
        console.log(`🔄 Image transition: ${prev.image + 1} -> ${nextImageIndex + 1} (total: ${activeSlideshows[prev.slideshow].images.length}) in slideshow ${activeSlideshows[prev.slideshow].title}`);
        
        return { ...prev, image: nextImageIndex };
      });
    }, 15000);

    return () => {
      if (imageIntervalRef.current) {
        clearInterval(imageIntervalRef.current);
        imageIntervalRef.current = null;
      }
    };
  }, [position.slideshow, activeSlideshows, loading]);

  // التنقل بين السلايد شوز - تم إصلاح المشكلة
  useEffect(() => {
    if (slideshowRotationRef.current) {
      clearInterval(slideshowRotationRef.current);
      slideshowRotationRef.current = null;
    }

    // إذا كان هناك سلايد واحد فقط، لا نحتاج للتنقل
    if (activeSlideshows.length <= 1) {
      console.log('⏸️ Only one or no slideshow active, rotation disabled');
      return;
    }

    console.log(`🔄 Setting up slideshow rotation with ${activeSlideshows.length} slideshows, interval: ${rotationInterval} seconds`);

    // بدء مؤقت جديد للتنقل بين السلايدات
    slideshowRotationRef.current = setInterval(() => {
      console.log(`🎭 Slideshow rotation triggered after ${rotationInterval} seconds`);
      
      setPosition((pos) => {
        const nextIndex = (pos.slideshow + 1) % activeSlideshows.length;
        console.log(`🎭 Slideshow changing: ${pos.slideshow + 1} -> ${nextIndex + 1} (total: ${activeSlideshows.length})`);
        return { slideshow: nextIndex, image: 0 };
      });
      
    }, rotationInterval * 1000);

    return () => {
      if (slideshowRotationRef.current) {
        clearInterval(slideshowRotationRef.current);
        slideshowRotationRef.current = null;
      }
    };
  }, [activeSlideshows.length, rotationInterval]);

  // Preload next image for smooth transition
  useEffect(() => {
    if (!activeSlideshows.length || loading) return;

    try {
      const currentSlideshow = activeSlideshows[position.slideshow];
      if (!currentSlideshow) return;

      // Preload next image in the current slideshow
      if (currentSlideshow.images.length > 1) {
        const nextImageIndex = (position.image + 1) % currentSlideshow.images.length;
        const nextImageUrl = currentSlideshow.images[nextImageIndex];
        if (nextImageUrl) {
          const img = new Image();
          img.src = nextImageUrl;
          console.log(`🖼️ Preloading next image in slideshow: ${nextImageUrl}`);
        }
      }

      // If on the last image, preload the first image of the next slideshow
      const isLastImage = position.image === currentSlideshow.images.length - 1;
      if (isLastImage && activeSlideshows.length > 1) {
        const nextSlideshowIndex = (position.slideshow + 1) % activeSlideshows.length;
        const nextSlideshow = activeSlideshows[nextSlideshowIndex];
        if (nextSlideshow?.images?.length > 0) {
          const nextSlideshowFirstImageUrl = nextSlideshow.images[0];
          if (nextSlideshowFirstImageUrl) {
            const img = new Image();
            img.src = nextSlideshowFirstImageUrl;
            console.log(`🖼️ Preloading first image of next slideshow: ${nextSlideshowFirstImageUrl}`);
          }
        }
      }
    } catch (error) {
      console.error("🔥 Error during image preloading:", error);
    }
  }, [activeSlideshows, position, loading]);


  // تنظيف المؤقتات عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  // Show loading screen only on the very first load
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

  // After initial load, if no active slideshows, render nothing.
  if (!activeSlideshows.length) {
    return null;
  }

  const currentSlideshow = activeSlideshows[position.slideshow];
  if (!currentSlideshow || currentSlideshow.images.length === 0) {
    return null;
  }

  const safeImageIndex = Math.max(0, Math.min(position.image, currentSlideshow.images.length - 1));
  const currentImage = currentSlideshow.images[safeImageIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full relative overflow-hidden">
        {/* Main image display */}
        <div className="w-full h-full">
          <img 
            key={`${currentSlideshow.id}-${safeImageIndex}`}
            src={currentImage}
            alt={`${currentSlideshow.title} - Slide ${safeImageIndex + 1}`}
            className="w-full h-full object-contain bg-black"
            style={{
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            onLoad={() => console.log('✅ Image loaded:', safeImageIndex + 1, 'of', currentSlideshow.images.length, currentImage)}
            onError={(e) => {
              console.error('❌ Image failed to load:', safeImageIndex + 1, currentImage);
              console.error('Error details:', e);
            }}
          />
        </div>
        
        {/* Slide indicators - للصور داخل السلايد شو الحالي */}
        {currentSlideshow.images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
            {currentSlideshow.images.map((_, index) => (
              <div 
                key={index} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === safeImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                }`} 
              />
            ))}
          </div>
        )}

        {/* Slideshow title overlay */}
        <div className="absolute top-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <h2 className="text-white text-xl font-semibold">{currentSlideshow.title}</h2>
          <div className="text-white/80 text-sm">
            <p>الصورة {safeImageIndex + 1} من {currentSlideshow.images.length}</p>
            {activeSlideshows.length > 1 && (
              <p>السلايد شو {position.slideshow + 1} من {activeSlideshows.length}</p>
            )}
          </div>
        </div>

        {/* Slideshow rotation indicators - للسلايد شوز */}
        {activeSlideshows.length > 1 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
            {activeSlideshows.map((_, index) => (
              <div 
                key={index} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === position.slideshow ? 'bg-blue-400 scale-125' : 'bg-blue-400/50'
                }`} 
              />
            ))}
          </div>
        )}

        {/* Progress bar - للسلايد شو الحالي */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-linear"
            style={{
              width: `${((safeImageIndex + 1) / currentSlideshow.images.length) * 100}%`
            }}
          />
        </div>

        {/* Status indicator */}
        <div className="absolute top-8 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-white text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-400' : 'bg-green-400'}`}></div>
              <span>{connectionError ? 'مشكلة اتصال' : 'متصل'}</span>
              {isLargeScreen && <span className="text-blue-300">📺</span>}
            </div>
            <div className="text-xs text-gray-300">
              {activeSlideshows.length} سلايد شو نشط | تنقل كل {rotationInterval}ث
            </div>
          </div>
        </div>

        {/* Enhanced debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-16 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs">
            <div>Slideshow: {position.slideshow + 1}/{activeSlideshows.length}</div>
            <div>Image: {safeImageIndex + 1}/{currentSlideshow.images.length}</div>
            <div>Title: {currentSlideshow.title}</div>
            <div>صور كل: 15 ثوانٍ</div>
            <div>سلايدات كل: {rotationInterval} ثانية</div>
            <div>Image Timer: {imageIntervalRef.current ? 'نشط' : 'متوقف'}</div>
            <div>Slideshow Timer: {slideshowRotationRef.current ? 'نشط' : 'متوقف'}</div>
            <div>Active Slideshows: {activeSlideshows.length}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideshowDisplay;
