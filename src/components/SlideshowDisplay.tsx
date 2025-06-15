
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
  const [activeSlideshow, setActiveSlideshow] = useState<Slideshow | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Detect if running on TV/large screen
  const isLargeScreen = window.innerWidth >= 1200 || window.screen.width >= 1200;

  const fetchActiveSlideshow = async () => {
    try {
      console.log('🎬 Fetching active slideshow for:', accountId);
      
      const { data, error } = await supabase
        .from('account_slideshows')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        console.log('✅ Active slideshow found:', data.title, 'Images:', data.images.length);
        setActiveSlideshow(data);
        setCurrentImageIndex(0);
        setConnectionError(false);
        setLoading(false);
      } else {
        console.log('🚫 No active slideshow found');
        setActiveSlideshow(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error fetching slideshow:', error);
      setConnectionError(true);
      setLoading(false);
      
      if (isLargeScreen) {
        setActiveSlideshow(null);
      }
    }
  };

  // Realtime listener
  useEffect(() => {
    if (!accountId) return;

    console.log('📡 Setting up realtime listener for:', accountId);
    
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
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            const updatedData = payload.new as any;
            
            if ((updatedData && !updatedData.is_active) || payload.eventType === 'DELETE') {
              if (isLargeScreen) {
                console.log('📺 Large screen - immediate exit');
                setActiveSlideshow(null);
                return;
              }
            }
          }
          
          await fetchActiveSlideshow();
        }
      )
      .subscribe();

    channelRef.current = channel;

    const pollingInterval = setInterval(() => {
      fetchActiveSlideshow();
    }, 2000);

    return () => {
      clearInterval(pollingInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [accountId, isLargeScreen]);

  // Initial fetch
  useEffect(() => {
    fetchActiveSlideshow();
  }, [accountId]);

  // إصلاح منطق التنقل بين الصور - SIMPLIFIED AND FIXED
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only start if we have slideshow with multiple images
    if (!activeSlideshow || activeSlideshow.images.length <= 1 || loading) {
      console.log('🚫 Not starting slideshow - missing conditions');
      return;
    }

    console.log('🎬 Starting slideshow timer:', {
      imagesCount: activeSlideshow.images.length,
      intervalSeconds: activeSlideshow.interval_seconds,
      currentIndex: currentImageIndex
    });

    // Start the interval
    intervalRef.current = setInterval(() => {
      console.log('⏰ Timer fired - moving to next image');
      
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % activeSlideshow.images.length;
        console.log(`🔄 Image transition: ${prevIndex + 1} -> ${nextIndex + 1} (total: ${activeSlideshow.images.length})`);
        return nextIndex;
      });
    }, activeSlideshow.interval_seconds * 1000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        console.log('🧹 Cleaning up slideshow interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeSlideshow?.id, activeSlideshow?.images.length, activeSlideshow?.interval_seconds, loading]);

  // Force exit conditions
  if (!activeSlideshow || loading) {
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

  if (activeSlideshow.images.length === 0) {
    return null;
  }

  const currentImage = activeSlideshow.images[currentImageIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full relative overflow-hidden">
        {/* Main image display */}
        <div className="w-full h-full">
          <img 
            key={`${activeSlideshow.id}-${currentImageIndex}`}
            src={currentImage}
            alt={`${activeSlideshow.title} - Slide ${currentImageIndex + 1}`}
            className="w-full h-full object-contain bg-black"
            style={{
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            onLoad={() => console.log('✅ Image loaded:', currentImageIndex + 1, currentImage)}
            onError={(e) => {
              console.error('❌ Image failed to load:', currentImageIndex + 1, currentImage);
              console.error('Error details:', e);
            }}
          />
        </div>
        
        {/* Slide indicators */}
        {activeSlideshow.images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
            {activeSlideshow.images.map((_, index) => (
              <div 
                key={index} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                }`} 
              />
            ))}
          </div>
        )}

        {/* Slideshow title overlay */}
        <div className="absolute top-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <h2 className="text-white text-xl font-semibold">{activeSlideshow.title}</h2>
          <p className="text-white/80 text-sm">
            الصورة {currentImageIndex + 1} من {activeSlideshow.images.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-linear"
            style={{
              width: `${((currentImageIndex + 1) / activeSlideshow.images.length) * 100}%`
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
              {activeSlideshow.images.length} صور | {activeSlideshow.interval_seconds}ث
            </div>
          </div>
        </div>

        {/* Debug info - shows current state */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-16 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs">
            <div>Index: {currentImageIndex}</div>
            <div>Total: {activeSlideshow.images.length}</div>
            <div>Interval: {activeSlideshow.interval_seconds}s</div>
            <div>Timer: {intervalRef.current ? 'Active' : 'Inactive'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideshowDisplay;
