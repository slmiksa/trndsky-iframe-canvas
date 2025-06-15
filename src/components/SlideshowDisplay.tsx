
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
  const [forceHide, setForceHide] = useState(false);

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
        setActiveSlideshow(null);
        setForceHide(true);
        return;
      }

      if (data) {
        console.log('✅ Active slideshow found:', data.title);
        setActiveSlideshow(data);
        setCurrentImageIndex(0);
        setImagesLoaded([]);
        setForceHide(false);
        
        // Start preloading images
        preloadImages(data.images);
      } else {
        console.log('ℹ️ No active slideshow found - hiding display');
        setActiveSlideshow(null);
        setForceHide(true);
      }
    } catch (error) {
      console.error('❌ Exception fetching active slideshow:', error);
      setActiveSlideshow(null);
      setForceHide(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSlideshow();

    // Enhanced realtime listener with multiple channels for redundancy
    const mainChannel = supabase
      .channel(`slideshows-main-${accountId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_slideshows',
          filter: `account_id=eq.${accountId}`
        },
        async (payload) => {
          console.log('🎬 Main channel - Slideshow change detected:', payload.eventType, payload);
          
          // فوري - بدون تأخير
          await fetchActiveSlideshow();
          
          // إذا كان الحدث هو UPDATE أو DELETE، فرض الإخفاء
          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            const updatedData = payload.new as any;
            if (updatedData && !updatedData.is_active) {
              console.log('🚫 Slideshow deactivated - forcing hide');
              setForceHide(true);
              setActiveSlideshow(null);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🎬 Main channel status:', status);
      });

    // Backup channel للتأكد المضاعف
    const backupChannel = supabase
      .channel(`slideshows-backup-${accountId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'account_slideshows',
          filter: `account_id=eq.${accountId}`
        },
        async (payload) => {
          console.log('🔄 Backup channel - Update detected:', payload);
          const updatedData = payload.new as any;
          
          if (updatedData && !updatedData.is_active) {
            console.log('🚫 Backup channel - Slideshow deactivated');
            setForceHide(true);
            setActiveSlideshow(null);
          }
          
          await fetchActiveSlideshow();
        }
      )
      .subscribe();

    // Aggressive polling للشاشات الكبيرة والتلفزيون - كل ثانية
    const aggressiveInterval = setInterval(() => {
      console.log('🔄 Aggressive polling check (1s)');
      fetchActiveSlideshow();
    }, 1000);

    // Super aggressive polling للشاشات العنيدة - كل 500ms
    const superAggressiveInterval = setInterval(() => {
      console.log('⚡ Super aggressive polling check (500ms)');
      fetchActiveSlideshow();
    }, 500);

    return () => {
      console.log('🧹 Cleaning up slideshow listeners');
      clearInterval(aggressiveInterval);
      clearInterval(superAggressiveInterval);
      supabase.removeChannel(mainChannel);
      supabase.removeChannel(backupChannel);
    };
  }, [accountId]);

  // Enhanced auto-advance with smooth transitions
  useEffect(() => {
    if (!activeSlideshow || activeSlideshow.images.length <= 1 || forceHide) return;

    const interval = setInterval(() => {
      // التحقق من الحالة النشطة قبل التقدم
      if (forceHide || !activeSlideshow) {
        console.log('🚫 Slideshow stopped, clearing interval');
        return;
      }

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
        }, 300);
      } else {
        console.log('⏳ Waiting for image to load before advancing...');
      }
    }, activeSlideshow.interval_seconds * 1000);

    return () => clearInterval(interval);
  }, [activeSlideshow, currentImageIndex, imagesLoaded, forceHide]);

  // إخفاء السلايدات فوراً إذا لم توجد سلايدات نشطة أو إذا كان مُجبر على الإخفاء
  if (loading || !activeSlideshow || activeSlideshow.images.length === 0 || forceHide) {
    console.log('🙈 Hiding slideshow:', { loading, hasSlideshow: !!activeSlideshow, forceHide });
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

        {/* Force hide indicator for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-16 right-8 bg-red-900/70 backdrop-blur-sm rounded-lg px-2 py-1">
            <div className="text-white text-xs">
              Force Hide: {forceHide ? 'نعم' : 'لا'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideshowDisplay;
