
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Preload images and cache them globally
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
          img.onload = () => {
            console.log(`✅ Image ${index + 1}/${imageUrls.length} loaded successfully`);
            imageCache.set(url, img);
            resolve(img);
          };
          img.onerror = () => {
            console.error(`❌ Failed to load image ${index + 1}:`, url);
            reject(new Error(`Failed to load image: ${url}`));
          };
          img.src = url;
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
      
      const { data, error } = await supabase
        .from('account_slideshows')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching active slideshow:', error);
        handleNoActiveSlideshow();
        return;
      }

      if (data) {
        console.log('✅ Active slideshow found:', data.title);
        
        // Check if this slideshow is already cached
        const cacheKey = `${data.id}-${JSON.stringify(data.images)}`;
        if (slideshowCache.has(cacheKey) && activeSlideshow?.id === data.id) {
          console.log('📦 Using cached slideshow data');
          return;
        }

        // Cache the slideshow
        slideshowCache.set(cacheKey, data);
        setActiveSlideshow(data);
        setCurrentImageIndex(0);
        setShouldHide(false);
        
        // Start preloading images
        await preloadImagesOptimized(data.images, data.id);
      } else {
        console.log('ℹ️ No active slideshow found');
        handleNoActiveSlideshow();
      }
    } catch (error) {
      console.error('❌ Exception fetching active slideshow:', error);
      handleNoActiveSlideshow();
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

  useEffect(() => {
    fetchActiveSlideshow();

    // Enhanced realtime listener with immediate response
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
          
          // Refresh slideshow data
          await fetchActiveSlideshow();
        }
      )
      .subscribe((status) => {
        console.log('🎬 Realtime status:', status);
      });

    // Aggressive polling for TV screens - every 500ms
    const aggressiveInterval = setInterval(() => {
      console.log('⚡ Ultra-fast check (500ms)');
      fetchActiveSlideshow();
    }, 500);

    return () => {
      console.log('🧹 Cleaning up slideshow listeners');
      clearInterval(aggressiveInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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
      }, 200); // Faster transition
    }, activeSlideshow.interval_seconds * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeSlideshow, allImagesLoaded, shouldHide]);

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

        {/* Cache status indicator */}
        <div className="absolute top-8 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-white text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>محمل بالكامل</span>
            </div>
            <div className="text-xs text-gray-300">
              {activeSlideshow.images.length} صور محفوظة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideshowDisplay;
