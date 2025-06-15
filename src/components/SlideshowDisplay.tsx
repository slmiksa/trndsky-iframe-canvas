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
}

const SlideshowDisplay: React.FC<SlideshowDisplayProps> = ({ accountId }) => {
  const [activeSlideshows, setActiveSlideshows] = useState<Slideshow[]>([]);
  const [currentSlideshowIndex, setCurrentSlideshowIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(30);
  const imageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const slideshowRotationRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

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

      // تصفية السلايدات النشطة فقط
      const newActiveSlides = data?.filter(slide => slide.is_active) || [];

      setActiveSlideshows(prevSlideshows => {
        const currentSlideshowId = prevSlideshows[currentSlideshowIndex]?.id;
        
        // If the new list is empty, reset everything.
        if (newActiveSlides.length === 0) {
          console.log('🚫 No active slideshows found, resetting.');
          setCurrentSlideshowIndex(0);
          setCurrentImageIndex(0);
          return [];
        }

        // Try to find the currently playing slideshow in the new list.
        const newIndexOfCurrent = newActiveSlides.findIndex(s => s.id === currentSlideshowId);

        if (newIndexOfCurrent !== -1) {
          // The current slideshow is still active. Update its index just in case the order changed.
          setCurrentSlideshowIndex(newIndexOfCurrent);
        } else {
          // The current slideshow is gone, or this is the initial load. Reset to the beginning.
          setCurrentSlideshowIndex(0);
          setCurrentImageIndex(0);
        }
        
        console.log('✅ Active slideshows updated:', newActiveSlides.length);
        return newActiveSlides;
      });

      setConnectionError(false);
    } catch (error) {
      console.error('❌ Error fetching slideshows:', error);
      setConnectionError(true);
      if (isLargeScreen) {
        setActiveSlideshows([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Realtime listener
  useEffect(() => {
    if (!accountId) return;

    console.log('📡 Setting up realtime listener for:', accountId);
    
    fetchRotationInterval();
    
    const channel = supabase
      .channel(`slideshow-${accountId}`)
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

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [accountId, isLargeScreen]);

  // Initial fetch
  useEffect(() => {
    fetchActiveSlideshows();
  }, [accountId]);

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
    // تنظيف مؤقت الصور السابق
    if (imageIntervalRef.current) {
      clearInterval(imageIntervalRef.current);
      imageIntervalRef.current = null;
    }

    const currentSlideshow = activeSlideshows[currentSlideshowIndex];
    if (!currentSlideshow || currentSlideshow.images.length <= 1 || loading) {
      return;
    }

    console.log('🎬 Starting image rotation for slideshow:', {
      title: currentSlideshow.title,
      imagesCount: currentSlideshow.images.length,
      intervalSeconds: 5
    });

    // تنقل بين الصور كل 5 ثوانٍ
    imageIntervalRef.current = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % currentSlideshow.images.length;
        console.log(`🔄 Image transition: ${prevIndex + 1} -> ${nextIndex + 1} (total: ${currentSlideshow.images.length})`);
        return nextIndex;
      });
    }, 5000);

    return () => {
      if (imageIntervalRef.current) {
        clearInterval(imageIntervalRef.current);
        imageIntervalRef.current = null;
      }
    };
  }, [currentSlideshowIndex, activeSlideshows, loading]);

  // التنقل بين السلايد شوز - تم إصلاح المشكلة
  useEffect(() => {
    // تنظيف مؤقت السلايد شو السابق أولاً
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
      
      // Reset image index for the new slideshow and then advance to it.
      setCurrentImageIndex(0);
      setCurrentSlideshowIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % activeSlideshows.length;
        console.log(`🎭 Slideshow changing: ${prevIndex + 1} -> ${nextIndex + 1} (total: ${activeSlideshows.length})`);
        return nextIndex;
      });
      
    }, rotationInterval * 1000);

    return () => {
      if (slideshowRotationRef.current) {
        clearInterval(slideshowRotationRef.current);
        slideshowRotationRef.current = null;
      }
    };
  }, [activeSlideshows.length, rotationInterval]);

  // تنظيف المؤقتات عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  // Force exit conditions
  if (!activeSlideshows.length || loading) {
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
    return null;
  }

  const currentSlideshow = activeSlideshows[currentSlideshowIndex];
  if (!currentSlideshow || currentSlideshow.images.length === 0) {
    return null;
  }

  const safeCurrentIndex = Math.max(0, Math.min(currentImageIndex, currentSlideshow.images.length - 1));
  const currentImage = currentSlideshow.images[safeCurrentIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full relative overflow-hidden">
        {/* Main image display */}
        <div className="w-full h-full">
          <img 
            key={`${currentSlideshow.id}-${safeCurrentIndex}`}
            src={currentImage}
            alt={`${currentSlideshow.title} - Slide ${safeCurrentIndex + 1}`}
            className="w-full h-full object-contain bg-black"
            style={{
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            onLoad={() => console.log('✅ Image loaded:', safeCurrentIndex + 1, 'of', currentSlideshow.images.length, currentImage)}
            onError={(e) => {
              console.error('❌ Image failed to load:', safeCurrentIndex + 1, currentImage);
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
                  index === safeCurrentIndex ? 'bg-white scale-125' : 'bg-white/50'
                }`} 
              />
            ))}
          </div>
        )}

        {/* Slideshow title overlay */}
        <div className="absolute top-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <h2 className="text-white text-xl font-semibold">{currentSlideshow.title}</h2>
          <div className="text-white/80 text-sm">
            <p>الصورة {safeCurrentIndex + 1} من {currentSlideshow.images.length}</p>
            {activeSlideshows.length > 1 && (
              <p>السلايد شو {currentSlideshowIndex + 1} من {activeSlideshows.length}</p>
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
                  index === currentSlideshowIndex ? 'bg-blue-400 scale-125' : 'bg-blue-400/50'
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
              width: `${((safeCurrentIndex + 1) / currentSlideshow.images.length) * 100}%`
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
            <div>Slideshow: {currentSlideshowIndex + 1}/{activeSlideshows.length}</div>
            <div>Image: {safeCurrentIndex + 1}/{currentSlideshow.images.length}</div>
            <div>Title: {currentSlideshow.title}</div>
            <div>صور كل: 5 ثوانٍ</div>
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
