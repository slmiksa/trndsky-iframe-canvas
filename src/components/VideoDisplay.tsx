import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  video_url: string;
  is_active: boolean;
  branch_id?: string | null;
  account_id: string;
  created_at: string;
}

interface VideoDisplayProps {
  accountId: string;
  branchId?: string | null;
  onActivityChange: (isActive: boolean) => void;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({ accountId, branchId, onActivityChange }) => {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<any>(null);
  const isActiveRef = useRef(false);

  const isLargeScreen = window.innerWidth >= 1200 || window.screen.width >= 1200;

  const fetchActiveVideo = async () => {
    try {
      console.log('🎥 Fetching active video for account:', accountId, 'branch:', branchId);
      
      // Filter videos based on branch - STRICT branch filtering
      // For now, temporarily return null since video table doesn't exist yet
      // But when it exists, apply the same branch filtering logic as slideshows
      
      let videoData = null;
      const hasActive = false;

      // TODO: When video table is ready, implement this logic:
      /*
      const { data, error } = await supabase
        .from('account_videos')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true);

      if (error) throw error;

      let filteredVideos = data || [];
      
      if (branchId) {
        // Show only videos for this specific branch
        filteredVideos = filteredVideos.filter(video => {
          const videoBranchId = localStorage.getItem(`video_branch_${video.id}`);
          return videoBranchId === branchId;
        });
      } else {
        // Show only global videos (no branch association)
        filteredVideos = filteredVideos.filter(video => {
          const videoBranchId = localStorage.getItem(`video_branch_${video.id}`);
          return !videoBranchId || videoBranchId === '';
        });
      }

      videoData = filteredVideos.find(video => video.is_active) || null;
      const hasActive = !!videoData;
      */

      if (isActiveRef.current !== hasActive) {
        onActivityChange(hasActive);
        isActiveRef.current = hasActive;
        console.log(`🎥 Video activity state changed to: ${hasActive} for branch: ${branchId || 'main'}`);
      }

      setActiveVideo(videoData);
      setConnectionError(false);
    } catch (error) {
      console.error('❌ Error fetching video:', error);
      setConnectionError(true);
      if (isActiveRef.current) {
        onActivityChange(false);
        isActiveRef.current = false;
      }
      setActiveVideo(null);
    } finally {
      if (loading) setLoading(false);
    }
  };

  // Realtime listener and polling
  useEffect(() => {
    if (!accountId) return;

    console.log('📡 VideoDisplay: Setting up listeners for account:', accountId, 'branch:', branchId);
    
    fetchActiveVideo(); // Initial fetch
    
    const channel = supabase
      .channel(`video-display-${accountId}-${branchId || 'main'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_slideshows', // Will change to account_videos when ready
          filter: `account_id=eq.${accountId}`
        },
        async () => {
          console.log('📡 Video change detected, re-fetching.');
          await fetchActiveVideo();
        }
      )
      .subscribe();

    channelRef.current = channel;

    const backupInterval = setInterval(fetchActiveVideo, 10000); // Poll every 10s

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      clearInterval(backupInterval);
    };
  }, [accountId, branchId, onActivityChange]);

  // Auto-restart video when it ends
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo) return;

    const handleVideoEnd = () => {
      console.log('🔄 Video ended, restarting...');
      video.currentTime = 0;
      video.play().catch(e => console.error('❌ Error restarting video:', e));
    };

    video.addEventListener('ended', handleVideoEnd);
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, [activeVideo]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">جاري تحميل الفيديو...</p>
          {connectionError && (
            <p className="text-sm text-red-300 mt-2">مشكلة في الاتصال - جاري إعادة المحاولة</p>
          )}
        </div>
      </div>
    );
  }

  if (!activeVideo) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full relative overflow-hidden">
        <video
          ref={videoRef}
          src={activeVideo.video_url}
          className="w-full h-full object-contain bg-black"
          autoPlay
          muted
          loop
          playsInline
          style={{
            maxWidth: '100vw',
            maxHeight: '100vh',
            objectFit: 'contain',
            objectPosition: 'center'
          }}
          onLoadStart={() => console.log('🎥 Video loading started:', activeVideo.video_url)}
          onCanPlay={() => console.log('✅ Video can play:', activeVideo.title)}
          onError={(e) => {
            console.error('❌ Video failed to load:', activeVideo.video_url);
            console.error('Error details:', e);
          }}
        />

        <div className="absolute top-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <h2 className="text-white text-xl font-semibold">{activeVideo.title}</h2>
          <div className="text-white/80 text-sm">
            <p>فيديو نشط</p>
            {branchId && <p className="text-xs text-blue-300">فرع: {branchId}</p>}
            {!branchId && <p className="text-xs text-green-300">الحساب الرئيسي</p>}
          </div>
        </div>

        <div className="absolute top-8 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-white text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-400' : 'bg-green-400'}`}></div>
              <span>{connectionError ? 'مشكلة اتصال' : 'متصل'}</span>
              {isLargeScreen && <span className="text-red-300">🎥</span>}
            </div>
            <div className="text-xs text-gray-300">
              {activeVideo ? 'فيديو نشط' : 'لا يوجد فيديو نشط'}
            </div>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && activeVideo && (
          <div className="absolute bottom-16 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs">
            <div>عنوان: {activeVideo.title}</div>
            <div>URL: {activeVideo.video_url}</div>
            <div>Branch: {branchId || 'Main Account'}</div>
            <div>حالة: نشط وتشغيل تلقائي</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDisplay;
