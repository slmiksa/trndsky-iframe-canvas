
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
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const preloadedImages = useRef<HTMLImageElement[]>([]);

  // Preload all images
  const preloadImages = (imageUrls: string[]) => {
    console.log('🖼️ Preloading images:', imageUrls.length);
    const loadedFlags = new Array(imageUrls.length).fill(false);
    preloadedImages.current = [];

    imageUrls.forEach((url, index) => {
      const img = new Image();
      img.onload = () => {
        console.log('✅ Image loaded:', index + 1, '/', imageUrls.length);
        loadedFlags[index] = true;
        setImagesLoaded([...loadedFlags]);
      };
      img.onerror = () => {
        console.error('❌ Failed to load image:', url);
        loadedFlags[index] = false;
        setImagesLoaded([...loadedFlags]);
      };
      img.src = url;
      preloadedImages.current[index] = img;
    });
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
        return;
      }

      if (data) {
        console.log('✅ Active slideshow found:', data.title);
        setActiveSlideshow(data);
        setCurrentImageIndex(0);
        setImagesLoaded([]);
        
        // Start preloading images
        preloadImages(data.images);
      } else {
        console.log('ℹ️ No active slideshow found');
        setActiveSlideshow(null);
      }
    } catch (error) {
      console.error('❌ Exception fetching active slideshow:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSlideshow();

    // Set up realtime listener for slideshow changes
    const channel = supabase
      .channel(`slideshows-${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_slideshows',
          filter: `account_id=eq.${accountId}`
        },
        async (payload) => {
          console.log('🎬 Slideshow change detected:', payload.eventType);
          await fetchActiveSlideshow();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  // Enhanced auto-advance with smooth transitions
  useEffect(() => {
    if (!activeSlideshow || activeSlideshow.images.length <= 1) return;

    const interval = setInterval(() => {
      // Only advance if current image is loaded
      if (imagesLoaded[currentImageIndex]) {
        setIsTransitioning(true);
        
        setTimeout(() => {
          setCurrentImageIndex((prev) => {
            const nextIndex = (prev + 1) % activeSlideshow.images.length;
            console.log('🔄 Advancing to slide:', nextIndex + 1, '/', activeSlideshow.images.length);
            return nextIndex;
          });
          setIsTransitioning(false);
        }, 300); // Short transition delay
      } else {
        console.log('⏳ Waiting for image to load before advancing...');
      }
    }, activeSlideshow.interval_seconds * 1000);

    return () => clearInterval(interval);
  }, [activeSlideshow, currentImageIndex, imagesLoaded]);

  // لا تظهر أي شيء إذا لم توجد سلايدات نشطة
  if (loading || !activeSlideshow || activeSlideshow.images.length === 0) {
    return null;
  }

  const currentImage = activeSlideshow.images[currentImageIndex];
  const isCurrentImageLoaded = imagesLoaded[currentImageIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full relative overflow-hidden">
        {/* Loading indicator for current image */}
        {!isCurrentImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">جاري تحميل الصورة...</p>
              <p className="text-sm text-gray-300 mt-2">
                {currentImageIndex + 1} من {activeSlideshow.images.length}
              </p>
            </div>
          </div>
        )}

        {/* Main image display */}
        <div 
          className={`w-full h-full transition-opacity duration-300 ${
            isCurrentImageLoaded && !isTransitioning ? 'opacity-100' : 'opacity-0'
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
        </div>

        {/* Enhanced progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/20">
          <div 
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width: `${((currentImageIndex + 1) / activeSlideshow.images.length) * 100}%`
            }}
          />
        </div>

        {/* Loading status for all images */}
        <div className="absolute top-8 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-white text-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${isCurrentImageLoaded ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span>الصورة الحالية: {isCurrentImageLoaded ? 'محملة' : 'جاري التحميل'}</span>
            </div>
            <div className="text-xs text-gray-300">
              تم تحميل {imagesLoaded.filter(Boolean).length} من {activeSlideshow.images.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideshowDisplay;
