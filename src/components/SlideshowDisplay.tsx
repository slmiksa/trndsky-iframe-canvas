
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

// Global cache for preloaded images
const imageCache = new Map<string, HTMLImageElement>();
const slideshowCache = new Map<string, Slideshow>();

const SlideshowDisplay: React.FC<SlideshowDisplayProps> = ({ accountId }) => {
  const [activeSlideshow, setActiveSlideshow] = useState<Slideshow | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced fetch with automatic retry
  const fetchWithRetry = async (operation: () => Promise<any>, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setConnectionError(false);
        const result = await operation();
        setRetryAttempts(0);
        return result;
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error);
        setRetryAttempts(attempt);
        
        if (attempt === maxRetries) {
          setConnectionError(true);
          throw error;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

  // Preload images with retry mechanism
  const preloadImagesOptimized = async (imageUrls: string[], slideshowId: string) => {
    console.log('🖼️ Starting optimized image preload for slideshow:', slideshowId);
    
    // Check if images are already cached
    const cachedImages = imageUrls.filter(url => imageCache.has(url));
    if (cachedImages.length === imageUrls.length) {
      console.log('✅ All images already cached, using cache');
      setAllImagesLoaded(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setAllImagesLoaded(false);

    try {
      const loadPromises = imageUrls.map((url, index) => {
        if (imageCache.has(url)) {
          return Promise.resolve(imageCache.get(url));
        }

        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          let attempts = 0;
          const maxAttempts = 3;

          const tryLoad = () => {
            attempts++;
            img.onload = () => {
              console.log(`✅ Image ${index + 1}/${imageUrls.length} loaded successfully`);
              imageCache.set(url, img);
              resolve(img);
            };
            
            img.onerror = () => {
              if (attempts < maxAttempts) {
                console.log(`🔄 Retrying image load ${attempts}/${maxAttempts}:`, url);
                setTimeout(tryLoad, 1000 * attempts);
              } else {
                console.error(`❌ Failed to load image after ${maxAttempts} attempts:`, url);
                reject(new Error(`Failed to load image: ${url}`));
              }
            };
            
            img.src = url;
          };

          tryLoad();
        });
      });

      await Promise.all(loadPromises);
      console.log('🎉 All images preloaded and cached successfully');
      setAllImagesLoaded(true);
    } catch (error) {
      console.error('❌ Error preloading images:', error);
      setAllImagesLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSlideshow = async () => {
    try {
      console.log('🎬 Fetching active slideshow for:', accountId);
      
      const result = await fetchWithRetry(async () => {
        const { data, error } = await supabase
          .from('account_slideshows')
          .select('*')
          .eq('account_id', accountId)
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        return data;
      });

      if (result) {
        console.log('✅ Active slideshow found:', result.title);
        
        // Check if this slideshow is already cached
        const cacheKey = `${result.id}-${JSON.stringify(result.images)}`;
        if (slideshowCache.has(cacheKey) && activeSlideshow?.id === result.id) {
          console.log('📦 Using cached slideshow data');
          return;
        }

        // Cache the slideshow
        slideshowCache.set(cacheKey, result);
        setActiveSlideshow(result);
        setCurrentImageIndex(0);
        setShouldHide(false);
        
        // Start preloading images
        await preloadImagesOptimized(result.images, result.id);
      } else {
        console.log('ℹ️ No active slideshow found');
        handleNoActiveSlideshow();
      }
    } catch (error) {
      console.error('❌ Exception fetching active slideshow:', error);
      if (!connectionError) {
        handleNoActiveSlideshow();
      }
    }
  };

  const handleNoActiveSlideshow = () => {
    console.log('🚫 Handling no active slideshow - immediate hide');
    setShouldHide(true);
    setActiveSlideshow(null);
    setLoading(false);
    
    // Clear interval immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleSlideshowDeactivation = () => {
    console.log('🚫 Slideshow deactivated - immediate response');
    setShouldHide(true);
    setActiveSlideshow(null);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Force re-render
    setTimeout(() => {
      setShouldHide(true);
    }, 50);
  };

  // Auto-retry connection on error
  useEffect(() => {
    if (connectionError && retryAttempts < 5) {
      console.log('🔄 Auto-retrying connection in 5 seconds...');
      retryTimeoutRef.current = setTimeout(() => {
        fetchActiveSlideshow();
      }, 5000);
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [connectionError, retryAttempts, accountId]);

  useEffect(() => {
    fetchActiveSlideshow();

    // Enhanced realtime listener with connection recovery
    const setupRealtimeConnection = () => {
      channelRef.current = supabase
        .channel(`slideshows-enhanced-${accountId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'account_slideshows',
            filter: `account_id=eq.${accountId}`
          },
          async (payload) => {
            console.log('🎬 Realtime change detected:', payload.eventType, payload);
            
            if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
              const updatedData = payload.new as any;
              
              // Immediate response to deactivation
              if (updatedData && !updatedData.is_active) {
                console.log('🚫 IMMEDIATE deactivation detected');
                handleSlideshowDeactivation();
                return;
              }
              
              if (payload.eventType === 'DELETE') {
                console.log('🗑️ IMMEDIATE deletion detected');
                handleSlideshowDeactivation();
                return;
              }
            }
            
            // Refresh slideshow data with retry
            try {
              await fetchActiveSlideshow();
            } catch (error) {
              console.error('❌ Error refreshing slideshow after realtime update:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('🎬 Realtime status:', status);
          
          if (status === 'CHANNEL_ERROR') {
            console.log('🔄 Realtime connection failed, retrying in 3 seconds...');
            setTimeout(setupRealtimeConnection, 3000);
          } else if (status === 'CLOSED') {
            console.log('🔄 Realtime connection closed, attempting reconnect...');
            setTimeout(setupRealtimeConnection, 1000);
          }
        });
    };

    setupRealtimeConnection();

    // Reduced polling for better performance - every 2 seconds instead of 500ms
    const pollingInterval = setInterval(() => {
      if (!connectionError) {
        console.log('⚡ Periodic check (2s)');
        fetchActiveSlideshow();
      }
    }, 2000);

    return () => {
      console.log('🧹 Cleaning up slideshow listeners');
      clearInterval(pollingInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [accountId]);

  // Smooth auto-advance with cached images
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!activeSlideshow || activeSlideshow.images.length <= 1 || shouldHide || !allImagesLoaded) {
      return;
    }

    console.log('🎬 Starting smooth slideshow with interval:', activeSlideshow.interval_seconds);

    intervalRef.current = setInterval(() => {
      if (shouldHide || !activeSlideshow) {
        console.log('🚫 Slideshow stopped, clearing interval');
        return;
      }

      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentImageIndex((prev) => {
          const nextIndex = (prev + 1) % activeSlideshow.images.length;
          console.log('🔄 Smooth transition to slide:', nextIndex + 1, '/', activeSlideshow.images.length);
          return nextIndex;
        });
        setIsTransitioning(false);
      }, 200);
    }, activeSlideshow.interval_seconds * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeSlideshow, allImagesLoaded, shouldHide]);

  // Show connection error
  if (connectionError && retryAttempts >= 3) {
    return (
      <div className="fixed inset-0 bg-red-900 z-50 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-4">
          <div className="w-16 h-16 bg-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">خطأ في الاتصال</h3>
          <p className="text-sm text-gray-300 mb-4">
            فشل في تحميل البيانات - جاري إعادة المحاولة تلقائياً...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Immediate hide conditions
  if (shouldHide || loading || !activeSlideshow || activeSlideshow.images.length === 0) {
    console.log('🙈 Hiding slideshow:', { shouldHide, loading, hasSlideshow: !!activeSlideshow });
    return null;
  }

  // Don't show until all images are loaded
  if (!allImagesLoaded) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">جاري تحميل العرض التقديمي...</p>
          <p className="text-sm text-gray-300 mt-2">
            {activeSlideshow.images.length} صور
          </p>
          {retryAttempts > 0 && (
            <p className="text-xs text-yellow-300 mt-1">
              إعادة المحاولة {retryAttempts}/3...
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentImage = activeSlideshow.images[currentImageIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full relative overflow-hidden">
        {/* Main image display with cached images */}
        <div 
          className={`w-full h-full transition-opacity duration-200 ${
            !isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img 
            src={currentImage}
            alt={`${activeSlideshow.title} - Slide ${currentImageIndex + 1}`}
            className="w-full h-full object-contain bg-black"
            style={{
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            loading="eager"
          />
        </div>
        
        {/* Slide indicators */}
        {activeSlideshow.images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
            {activeSlideshow.images.map((_, index) => (
              <div 
                key={index} 
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                }`} 
              />
            ))}
          </div>
        )}

        {/* Slideshow title overlay */}
        <div className="absolute top-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <h2 className="text-white text-xl font-semibold">{activeSlideshow.title}</h2>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/20">
          <div 
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width: `${((currentImageIndex + 1) / activeSlideshow.images.length) * 100}%`
            }}
          />
        </div>

        {/* Enhanced status indicator */}
        <div className="absolute top-8 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-white text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-400' : 'bg-green-400'}`}></div>
              <span>{connectionError ? 'اتصال ضعيف' : 'محمل بالكامل'}</span>
            </div>
            <div className="text-xs text-gray-300">
              {activeSlideshow.images.length} صور محفوظة
            </div>
            {retryAttempts > 0 && (
              <div className="text-xs text-yellow-300">
                إعادة محاولة: {retryAttempts}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideshowDisplay;
