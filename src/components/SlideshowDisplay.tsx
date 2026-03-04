
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { debounce, performanceMonitor } from '@/utils/performanceOptimization';

interface Slideshow {
  id: string;
  title: string;
  images: string[];
  video_urls?: string[];
  media_type?: 'images' | 'videos' | 'mixed';
  interval_seconds: number;
  is_active: boolean;
}

interface SlideshowDisplayProps {
  accountId: string;
  onActivityChange: (isActive: boolean) => void;
}

const SlideshowDisplay: React.FC<SlideshowDisplayProps> = ({ accountId, onActivityChange }) => {
  const [activeSlideshow, setActiveSlideshow] = useState<Slideshow | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [loading, setLoading] = useState(false); // بدلاً من true
  const [connectionError, setConnectionError] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const mediaIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const isActiveRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadingRef = useRef(false);
  const retryCountRef = useRef(0);

  // تحسين دالة التحميل مع مراقبة الأداء ومعالجة محسنة للأخطاء
  const fetchActiveSlideshow = useCallback(async () => {
    try {
      performanceMonitor.start('slideshow-fetch');
      console.log('🎬 Fetching active slideshow for:', accountId);
      
      const { data, error } = await supabase.rpc('get_all_slideshows_for_account', {
        p_account_id: accountId
      });

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('📊 Fetched slideshows data:', data?.length || 0, 'slideshows');
      
      const firstActiveSlide = data?.find(slide => slide.is_active) || null;
      const hasActive = !!firstActiveSlide;

      // التحقق من وجود محتوى في السلايدة النشطة
      if (firstActiveSlide) {
        const hasImages = firstActiveSlide.images && firstActiveSlide.images.length > 0;
        const hasVideos = (firstActiveSlide as any).video_urls && (firstActiveSlide as any).video_urls.length > 0;
        
        if (!hasImages && !hasVideos) {
          console.warn('⚠️ Active slideshow has no media content');
          firstActiveSlide.is_active = false;
        }
      }

      if (isActiveRef.current !== hasActive) {
        console.log(`🎬 Slideshow activity state changing: ${isActiveRef.current} -> ${hasActive}`);
        onActivityChange(hasActive);
        isActiveRef.current = hasActive;
      }

      const getSlideshowSignature = (slide: Slideshow | null) => {
        if (!slide) return 'no-active-slides';
        const images = slide.images?.join(',') || '';
        const videos = slide.video_urls?.join(',') || '';
        const interval = slide.interval_seconds || 15;
        return `${slide.id}:${images}:${videos}:${interval}`;
      };

      // تحويل البيانات من قاعدة البيانات إلى النوع المطلوب
      const normalizedSlide: Slideshow | null = firstActiveSlide ? {
        id: firstActiveSlide.id,
        title: firstActiveSlide.title,
        images: firstActiveSlide.images || [],
        video_urls: (firstActiveSlide as any).video_urls || [],
        media_type: ((firstActiveSlide as any).media_type || 'images') as 'images' | 'videos' | 'mixed',
        interval_seconds: firstActiveSlide.interval_seconds,
        is_active: firstActiveSlide.is_active
      } : null;

      setActiveSlideshow(prevSlideshow => {
        const prevSignature = getSlideshowSignature(prevSlideshow);
        const newSignature = getSlideshowSignature(normalizedSlide);

        if (prevSignature === newSignature) {
          console.log('✅ Slideshow content is identical, no update needed.');
          return prevSlideshow;
        }
        
        console.log('🔄 Slideshow content changed, resetting state');
        setMediaIndex(0);
        setIsVideoEnded(false);
        
        return normalizedSlide;
      });

      setConnectionError(false);
      retryCountRef.current = 0;
      performanceMonitor.end('slideshow-fetch');
      
    } catch (error) {
      console.error('❌ Error fetching slideshow:', error);
      retryCountRef.current += 1;
      setConnectionError(true);
      
      // لا نحذف السلايدشو الحالي عند خطأ مؤقت - نبقيه ظاهراً
      // فقط نحذفه إذا تكرر الخطأ أكثر من 5 مرات متتالية
      if (retryCountRef.current > 5) {
        console.error('❌ Too many consecutive errors, clearing slideshow');
        if (isActiveRef.current) {
          onActivityChange(false);
          isActiveRef.current = false;
        }
        setActiveSlideshow(null);
        setMediaIndex(0);
        setIsVideoEnded(false);
      }
      
      performanceMonitor.end('slideshow-fetch');
    } finally {
      if (loadingRef.current || loading) {
        console.log('🎬 Initial loading completed');
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [accountId, onActivityChange]);

  const fetchRef = useRef(fetchActiveSlideshow);
  fetchRef.current = fetchActiveSlideshow;

  const debouncedFetch = useCallback(
    debounce(() => fetchRef.current(), 1000),
    []
  );

  // Realtime listener and polling
  useEffect(() => {
    if (!accountId) return;

    console.log('📡 SlideshowDisplay: Setting up optimized listeners for:', accountId);
    
    let isActive = true;
    
    fetchActiveSlideshow();
    
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
    if (mediaIntervalRef.current) {
      clearInterval(mediaIntervalRef.current);
      mediaIntervalRef.current = null;
    }
  };

  // دمج الصور والفيديوهات في مصفوفة واحدة
  const getAllMedia = (slideshow: Slideshow) => {
    const media = [];
    
    // إضافة الصور
    if (slideshow.images) {
      media.push(...slideshow.images.map(url => ({ url, type: 'image' })));
    }
    
    // إضافة الفيديوهات
    if (slideshow.video_urls) {
      media.push(...slideshow.video_urls.map(url => ({ url, type: 'video' })));
    }
    
    return media;
  };

  // Media rotation within the current slideshow - Enhanced reliability
  useEffect(() => {
    clearAllTimers();

    if (!activeSlideshow || loading) {
      console.log('🎬 Media rotation skipped: no slideshow or loading');
      return;
    }

    const allMedia = getAllMedia(activeSlideshow);
    
    if (allMedia.length === 0) {
      console.log('🎬 No media found in slideshow');
      return;
    }

    if (allMedia.length === 1) {
      console.log('🎬 Single media item, no rotation needed');
      return;
    }

    // التأكد من أن mediaIndex في النطاق الصحيح
    const safeIndex = Math.max(0, Math.min(mediaIndex, allMedia.length - 1));
    if (safeIndex !== mediaIndex) {
      console.log(`🔧 Correcting media index from ${mediaIndex} to ${safeIndex}`);
      setMediaIndex(safeIndex);
      return;
    }

    console.log('🎬 Starting media rotation for slideshow:', {
      title: activeSlideshow.title,
      currentIndex: mediaIndex,
      totalMedia: allMedia.length,
      images: activeSlideshow.images?.length || 0,
      videos: activeSlideshow.video_urls?.length || 0
    });

    const currentMedia = allMedia[mediaIndex];
    
    if (!currentMedia) {
      console.error('❌ Current media is undefined, resetting to first item');
      setMediaIndex(0);
      return;
    }
    
    // إذا كان العنصر الحالي صورة، ننتقل بعد 15 ثانية
    if (currentMedia.type === 'image') {
      const intervalTime = 15000; // 15 ثانية كما طلب المستخدم
      console.log(`🖼️ Setting image timer for ${intervalTime}ms (15 seconds)`);
      
      mediaIntervalRef.current = setInterval(() => {
        setMediaIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % allMedia.length;
          console.log(`🔄 Image timer transition: ${prevIndex + 1} -> ${nextIndex + 1} (total: ${allMedia.length})`);
          return nextIndex;
        });
      }, intervalTime);
    }
    
    // إذا كان فيديو وانتهى، ننتقل للعنصر التالي
    if (currentMedia.type === 'video' && isVideoEnded) {
      console.log('🎥 Video ended, transitioning to next media');
      const timeout = setTimeout(() => {
        setMediaIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % allMedia.length;
          console.log(`🔄 Video ended transition: ${prevIndex + 1} -> ${nextIndex + 1}`);
          setIsVideoEnded(false);
          return nextIndex;
        });
      }, 1000);

      return () => clearTimeout(timeout);
    }

    return () => {
      console.log('🧹 Cleaning up media rotation timers');
      clearAllTimers();
    };
  }, [activeSlideshow, loading, mediaIndex, isVideoEnded]);

  // Preload next media
  useEffect(() => {
    if (!activeSlideshow || loading) return;

    const allMedia = getAllMedia(activeSlideshow);
    
    if (allMedia.length > 1) {
      const nextMediaIndex = (mediaIndex + 1) % allMedia.length;
      const nextMedia = allMedia[nextMediaIndex];
      
      if (nextMedia.type === 'image') {
        const img = new Image();
        img.src = nextMedia.url;
        console.log(`🖼️ Preloading next image: ${nextMedia.url}`);
      }
    }
  }, [activeSlideshow, mediaIndex, loading]);

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

  // إخفاء المكون تماماً إذا لم يكن هناك slideshow نشط أو إذا كان في حالة تحميل
  if (!activeSlideshow || loading) {
    return null;
  }

  const allMedia = getAllMedia(activeSlideshow);
  
  if (allMedia.length === 0) {
    return null;
  }

  const safeMediaIndex = Math.max(0, Math.min(mediaIndex, allMedia.length - 1));
  const currentMedia = allMedia[safeMediaIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full relative overflow-hidden">
        <div className="w-full h-full">
          {currentMedia.type === 'image' ? (
            <img 
              key={`${activeSlideshow.id}-${safeMediaIndex}`}
              src={currentMedia.url}
              alt={`${activeSlideshow.title} - Media ${safeMediaIndex + 1}`}
              className="w-full h-full object-contain bg-black"
              style={{
                maxWidth: '100vw',
                maxHeight: '100vh',
                objectFit: 'contain',
                objectPosition: 'center'
              }}
              onLoad={() => console.log('✅ Image loaded:', safeMediaIndex + 1, 'of', allMedia.length, currentMedia.url)}
              onError={(e) => {
                console.error('❌ Image failed to load:', safeMediaIndex + 1, currentMedia.url);
                console.error('Error details:', e);
                // التنقل التلقائي للعنصر التالي في حالة فشل تحميل الصورة
                setTimeout(() => {
                  if (allMedia.length > 1) {
                    setMediaIndex(prevIndex => {
                      const nextIndex = (prevIndex + 1) % allMedia.length;
                      console.log(`🔄 Auto-advancing due to image error: ${prevIndex + 1} -> ${nextIndex + 1}`);
                      return nextIndex;
                    });
                  }
                }, 2000);
              }}
            />
          ) : (
            <video 
              ref={videoRef}
              key={`${activeSlideshow.id}-${safeMediaIndex}`}
              src={currentMedia.url}
              className="w-full h-full object-contain bg-black"
              style={{
                maxWidth: '100vw',
                maxHeight: '100vh',
                objectFit: 'contain',
                objectPosition: 'center'
              }}
              autoPlay
              muted
              controls={false}
              loop={allMedia.length === 1}
              playsInline
              preload="auto"
              onCanPlay={() => {
                console.log('🎥 Video can play:', safeMediaIndex + 1, currentMedia.url);
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().then(() => {
                    console.log('✅ Video started playing successfully');
                  }).catch((err) => {
                    console.error('❌ Failed to play video:', err);
                  });
                }
              }}
              onPlay={() => {
                console.log('▶️ Video playing:', safeMediaIndex + 1);
              }}
              onEnded={() => {
                console.log('✅ Video ended:', safeMediaIndex + 1, 'of', allMedia.length);
                if (allMedia.length > 1) {
                  setIsVideoEnded(true);
                }
              }}
              onLoadedData={() => {
                console.log('✅ Video loaded:', safeMediaIndex + 1, 'of', allMedia.length, currentMedia.url);
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().catch(console.error);
                }
              }}
              onError={(e) => {
                console.error('❌ Video failed to load:', safeMediaIndex + 1, currentMedia.url);
                console.error('Error details:', e);
                // التنقل للعنصر التالي عند فشل تحميل الفيديو
                setTimeout(() => {
                  if (allMedia.length > 1) {
                    setMediaIndex(prevIndex => {
                      const nextIndex = (prevIndex + 1) % allMedia.length;
                      console.log(`🔄 Auto-advancing due to video error: ${prevIndex + 1} -> ${nextIndex + 1}`);
                      return nextIndex;
                    });
                  }
                }, 2000);
              }}
            />
          )}
        </div>
        
        {allMedia.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
            {allMedia.map((media, index) => (
              <div 
                key={index} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === safeMediaIndex ? 'bg-white scale-125' : 'bg-white/50'
                }`} 
              />
            ))}
          </div>
        )}

        <div className="absolute top-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <h2 className="text-white text-xl font-semibold">{activeSlideshow.title}</h2>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-linear"
            style={{
              width: `${((safeMediaIndex + 1) / allMedia.length) * 100}%`
            }}
          />
        </div>

        {process.env.NODE_ENV === 'development' && activeSlideshow && (
          <div className="absolute bottom-16 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs">
            <div>Media: {safeMediaIndex + 1}/{allMedia.length}</div>
            <div>Type: {currentMedia.type}</div>
            <div>Title: {activeSlideshow.title}</div>
            <div>Images: {activeSlideshow.images?.length || 0}</div>
            <div>Videos: {activeSlideshow.video_urls?.length || 0}</div>
            <div>Media Timer: {mediaIntervalRef.current ? 'نشط' : 'متوقف'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideshowDisplay;
