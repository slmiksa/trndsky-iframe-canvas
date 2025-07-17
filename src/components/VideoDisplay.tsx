import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  video_url: string;
  is_active: boolean;
  account_id: string;
  created_at: string;
  updated_at: string;
}

interface VideoDisplayProps {
  accountId: string;
  onActivityChange?: (isActive: boolean) => void;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({ accountId, onActivityChange }) => {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Function to fetch active video
  const fetchActiveVideo = async () => {
    try {
      console.log('🎥 [VideoDisplay] جلب الفيديو النشط للحساب:', accountId);
      
      const { data, error } = await supabase
        .from('account_videos' as any)
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ [VideoDisplay] خطأ في جلب الفيديو:', error);
        setError('فشل في تحميل الفيديو');
        return;
      }

      const video = data && data.length > 0 ? (data[0] as unknown as Video) : null;
      console.log('✅ [VideoDisplay] الفيديو النشط:', video);
      
      setActiveVideo(video);
      setError(null);
      
      // Notify parent about activity status
      onActivityChange?.(!!video);
      
    } catch (error) {
      console.error('❌ [VideoDisplay] خطأ في fetchActiveVideo:', error);
      setError('حدث خطأ في تحميل الفيديو');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    console.log('🚀 [VideoDisplay] بدء تحميل الفيديو للحساب:', accountId);
    fetchActiveVideo();
  }, [accountId]);

  // Set up real-time listener
  useEffect(() => {
    if (!accountId) return;

    console.log('📡 [VideoDisplay] إعداد مستمع التحديثات المباشرة');
    
    const channel = supabase
      .channel(`account_videos_${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_videos',
          filter: `account_id=eq.${accountId}`
        },
        (payload) => {
          console.log('🎥 [VideoDisplay] تحديث مباشر للفيديو:', {
            event: payload.eventType,
            new: payload.new,
            old: payload.old
          });
          
          // Refetch videos after any change
          setTimeout(() => {
            console.log('🔄 [VideoDisplay] إعادة تحميل الفيديو بعد التحديث');
            fetchActiveVideo();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('📡 [VideoDisplay] حالة الاشتراك:', status);
      });

    // Polling as fallback
    const interval = setInterval(() => {
      console.log('⏰ [VideoDisplay] تحديث دوري للفيديو');
      fetchActiveVideo();
    }, 10000);

    return () => {
      console.log('🧹 [VideoDisplay] تنظيف الموارد');
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  // Handle video events
  const handleVideoLoad = () => {
    console.log('✅ [VideoDisplay] تم تحميل الفيديو بنجاح');
    setError(null);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const error = (e.target as HTMLVideoElement).error;
    console.error('❌ [VideoDisplay] خطأ في تشغيل الفيديو:', error);
    setError('فشل في تشغيل الفيديو');
  };

  const handleVideoEnd = () => {
    console.log('🔄 [VideoDisplay] انتهى الفيديو - إعادة التشغيل');
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
    }
  };

  // Start video playback when video is available
  useEffect(() => {
    if (activeVideo && videoRef.current) {
      console.log('▶️ [VideoDisplay] بدء تشغيل الفيديو:', activeVideo.title);
      videoRef.current.play().catch((error) => {
        console.error('❌ [VideoDisplay] فشل في بدء التشغيل:', error);
      });
    }
  }, [activeVideo]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>جاري تحميل الفيديو...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-red-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-2">⚠️ خطأ</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!activeVideo) {
    console.log('🚫 [VideoDisplay] لا يوجد فيديو نشط');
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={activeVideo.video_url}
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        onEnded={handleVideoEnd}
        controls={false}
      />
      
      {/* Video title overlay */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
        <h3 className="text-lg font-semibold">{activeVideo.title}</h3>
      </div>
    </div>
  );
};

export default VideoDisplay;