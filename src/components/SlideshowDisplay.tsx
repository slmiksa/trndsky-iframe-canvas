
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
  const [forceHide, setForceHide] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const slideTransitionRef = useRef<NodeJS.Timeout | null>(null);

  // Detect if running on TV/large screen
  const isLargeScreen = window.innerWidth >= 1200 || window.screen.width >= 1200;

  // IMMEDIATE EXIT FUNCTION FOR TVs
  const forceExitSlideshow = () => {
    console.log('🚫 FORCE EXIT SLIDESHOW - IMMEDIATE');
    setForceHide(true);
    setShouldHide(true);
    setActiveSlideshow(null);
    setLoading(false);
    setCurrentImageIndex(0);
    
    // Clear all intervals and timeouts immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (forceCheckIntervalRef.current) {
      clearInterval(forceCheckIntervalRef.current);
      forceCheckIntervalRef.current = null;
    }
    if (slideTransitionRef.current) {
      clearTimeout(slideTransitionRef.current);
      slideTransitionRef.current = null;
    }
    
    // Force DOM update
    setTimeout(() => {
      setForceHide(true);
      setShouldHide(true);
    }, 10);
  };

  // Enhanced fetch with automatic retry and better error handling
  const fetchWithRetry = async (operation: () => Promise<any>, maxRetries = 2, delay = 1000) => {
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
          
          // If on large screen and connection fails, force hide
          if (isLargeScreen) {
            console.log('📺 Large screen detected - forcing hide on connection error');
            forceExitSlideshow();
          }
          
          throw error;
        }
        
        // Progressive wait time
        const waitTime = delay * attempt;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

  // IMPROVED IMAGE PRELOADING with better error handling
  const preloadImagesOptimized = async (imageUrls: string[], slideshowId: string) => {
    console.log('🖼️ Starting IMPROVED image preload for slideshow:', slideshowId);
    
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
          
          // Add crossorigin for better compatibility
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            console.log(`✅ Image ${index + 1}/${imageUrls.length} loaded successfully`);
            imageCache.set(url, img);
            resolve(img);
          };
          
          img.onerror = () => {
            console.error(`❌ Failed to load image ${index + 1}:`, url);
            // Don't reject, just continue with other images
            resolve(img);
          };
          
          // Set timeout for loading
          setTimeout(() => {
            if (!img.complete) {
              console.warn(`⏰ Image ${index + 1} loading timeout:`, url);
              resolve(img);
            }
          }, 5000);
          
          img.src = url;
        });
      });

      await Promise.allSettled(loadPromises);
      console.log('🎉 Image preloading completed - READY FOR DISPLAY');
      setAllImagesLoaded(true);
    } catch (error) {
      console.error('❌ Error in image preloading:', error);
      // Still allow slideshow to continue with available images
      setAllImagesLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSlideshow = async () => {
    try {
      console.log('🎬 Checking for active slideshow:', accountId);
      
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
        console.log('✅ Active slideshow found:', result.title, 'Images:', result.images.length);
        
        // Check if this slideshow is already loaded
        if (activeSlideshow?.id === result.id) {
          console.log('📦 Same slideshow already active');
          return;
        }

        // Reset force hide when new slideshow is found
        setForceHide(false);
        setActiveSlideshow(result);
        setCurrentImageIndex(0);
        setShouldHide(false);
        
        // Clear any existing slide transition
        if (slideTransitionRef.current) {
          clearTimeout(slideTransitionRef.current);
          slideTransitionRef.current = null;
        }
        
        // Start preloading images ONCE
        await preloadImagesOptimized(result.images, result.id);
      } else {
        console.log('🚫 No active slideshow found - IMMEDIATE HIDE');
        forceExitSlideshow();
      }
    } catch (error) {
      console.error('❌ Exception fetching active slideshow:', error);
      if (isLargeScreen) {
        console.log('📺 Large screen - forcing exit on error');
        forceExitSlideshow();
      }
    }
  };

  // Enhanced realtime listener with IMMEDIATE response for TVs
  useEffect(() => {
    if (!accountId) return;

    console.log('📡 Setting up ENHANCED realtime for TVs:', accountId);
    
    const setupRealtimeConnection = () => {
      // Primary channel for immediate updates
      const channel1 = supabase
        .channel(`slideshow-tv-${accountId}-${Date.now()}-1`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'account_slideshows',
            filter: `account_id=eq.${accountId}`
          },
          async (payload) => {
            console.log('📡 Channel 1 - Realtime change:', payload.eventType, payload);
            
            // IMMEDIATE response for deactivation on large screens
            if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
              const updatedData = payload.new as any;
              
              if ((updatedData && !updatedData.is_active) || payload.eventType === 'DELETE') {
                console.log('🚫 IMMEDIATE DEACTIVATION DETECTED');
                
                if (isLargeScreen) {
                  console.log('📺 Large screen - FORCE EXIT NOW');
                  forceExitSlideshow();
                  return;
                }
              }
            }
            
            // For other events or small screens, fetch normally
            await fetchActiveSlideshow();
          }
        )
        .subscribe();

      // Backup channel for redundancy
      const channel2 = supabase
        .channel(`slideshow-tv-${accountId}-${Date.now()}-2`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'account_slideshows',
            filter: `account_id=eq.${accountId}`
          },
          async (payload) => {
            console.log('📡 Channel 2 - Update detected:', payload);
            const updatedData = payload.new as any;
            
            if (updatedData && !updatedData.is_active) {
              console.log('🚫 Channel 2 - SLIDESHOW DEACTIVATED');
              
              if (isLargeScreen) {
                console.log('📺 Channel 2 - Large screen FORCE EXIT');
                forceExitSlideshow();
                return;
              }
            }
            
            await fetchActiveSlideshow();
          }
        )
        .subscribe();

      channelRef.current = { channel1, channel2 };
    };

    setupRealtimeConnection();

    // Reduced polling frequency to prevent overload
    const pollingInterval = setInterval(() => {
      console.log('⚡ Polling check');
      fetchActiveSlideshow();
    }, 2000); // Every 2 seconds

    // FORCE CHECK for large screens - safety net
    if (isLargeScreen) {
      forceCheckIntervalRef.current = setInterval(() => {
        console.log('🔥 FORCE CHECK for TV screens');
        fetchActiveSlideshow();
      }, 1000); // Every 1 second for TVs
    }

    return () => {
      console.log('🧹 Cleaning up TV-optimized listeners');
      clearInterval(pollingInterval);
      if (forceCheckIntervalRef.current) {
        clearInterval(forceCheckIntervalRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current.channel1);
        supabase.removeChannel(channelRef.current.channel2);
      }
    };
  }, [accountId, isLargeScreen]);

  // Initial fetch
  useEffect(() => {
    fetchActiveSlideshow();
  }, [accountId]);

  // IMPROVED Auto-advance slideshow with better error handling
  useEffect(() => {
    // Clear any existing interval and timeout
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (slideTransitionRef.current) {
      clearTimeout(slideTransitionRef.current);
      slideTransitionRef.current = null;
    }

    if (!activeSlideshow || activeSlideshow.images.length <= 1 || shouldHide || forceHide || !allImagesLoaded) {
      console.log('🚫 Slideshow conditions not met:', {
        hasSlideshow: !!activeSlideshow,
        imageCount: activeSlideshow?.images.length || 0,
        shouldHide,
        forceHide,
        allImagesLoaded
      });
      return;
    }

    console.log('🎬 Starting IMPROVED slideshow rotation:', activeSlideshow.interval_seconds, 'seconds');

    intervalRef.current = setInterval(() => {
      if (shouldHide || forceHide || !activeSlideshow) {
        console.log('🚫 Slideshow stopped due to hide flags');
        return;
      }

      console.log('🔄 Starting slide transition...');
      setIsTransitioning(true);
      
      // Clear any pending transition
      if (slideTransitionRef.current) {
        clearTimeout(slideTransitionRef.current);
      }
      
      slideTransitionRef.current = setTimeout(() => {
        setCurrentImageIndex((prev) => {
          const nextIndex = (prev + 1) % activeSlideshow.images.length;
          console.log('🔄 Transitioning to slide:', nextIndex + 1, '/', activeSlideshow.images.length);
          return nextIndex;
        });
        setIsTransitioning(false);
        console.log('✅ Slide transition completed');
      }, 200); // Slightly longer transition for stability
    }, activeSlideshow.interval_seconds * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (slideTransitionRef.current) {
        clearTimeout(slideTransitionRef.current);
        slideTransitionRef.current = null;
      }
    };
  }, [activeSlideshow, allImagesLoaded, shouldHide, forceHide]);

  // FORCE HIDE CONDITIONS - especially for TVs
  if (forceHide || shouldHide || loading || !activeSlideshow || activeSlideshow.images.length === 0) {
    console.log('🙈 HIDING slideshow:', { forceHide, shouldHide, loading, hasSlideshow: !!activeSlideshow, isLargeScreen });
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
            {activeSlideshow.images.length} صور - تحميل محسن
          </p>
          {connectionError && (
            <p className="text-sm text-red-300 mt-2">
              مشكلة في الاتصال - جاري إعادة المحاولة ({retryAttempts}/2)
            </p>
          )}
          {isLargeScreen && (
            <p className="text-xs text-blue-300 mt-1">
              📺 وضع الشاشة الكبيرة مُفعل
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
        {/* Main image display with improved loading */}
        <div 
          className={`w-full h-full transition-opacity duration-200 ${
            !isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img 
            key={`${currentImageIndex}-${activeSlideshow.id}`}
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
            crossOrigin="anonymous"
            onLoad={() => console.log('✅ Current image loaded:', currentImageIndex + 1)}
            onError={() => console.error('❌ Current image failed:', currentImageIndex + 1)}
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
          <p className="text-white/80 text-sm">
            الصورة {currentImageIndex + 1} من {activeSlideshow.images.length}
          </p>
        </div>

        {/* Enhanced progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-linear"
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
              <span>{connectionError ? 'مشكلة اتصال' : 'متصل'}</span>
              {isLargeScreen && <span className="text-blue-300">📺</span>}
            </div>
            <div className="text-xs text-gray-300">
              {activeSlideshow.images.length} صور | {activeSlideshow.interval_seconds}ث
            </div>
            {retryAttempts > 0 && (
              <div className="text-xs text-yellow-300">
                محاولة: {retryAttempts}/2
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideshowDisplay;
