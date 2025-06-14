
import React, { useState, useEffect } from 'react';
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

  // Auto-advance slides
  useEffect(() => {
    if (!activeSlideshow || activeSlideshow.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % activeSlideshow.images.length);
    }, activeSlideshow.interval_seconds * 1000);

    return () => clearInterval(interval);
  }, [activeSlideshow]);

  // لا تظهر أي شيء إذا لم توجد سلايدات نشطة
  if (loading || !activeSlideshow || activeSlideshow.images.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full relative">
        <img 
          src={activeSlideshow.images[currentImageIndex]} 
          alt={`${activeSlideshow.title} - Slide ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
          style={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
        
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
        <div className="absolute top-8 left-8 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <h2 className="text-white text-xl font-semibold">{activeSlideshow.title}</h2>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div 
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width: `${((currentImageIndex + 1) / activeSlideshow.images.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SlideshowDisplay;
