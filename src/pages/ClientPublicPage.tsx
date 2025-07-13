
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SlideshowDisplay from '@/components/SlideshowDisplay';
import VideoDisplay from '@/components/VideoDisplay';
import NotificationDisplay from '@/components/NotificationDisplay';
import NewsTickerDisplay from '@/components/NewsTickerDisplay';
import BreakTimerDisplay from '@/components/BreakTimerDisplay';

const ClientPublicPage: React.FC = () => {
  const { accountId, branchPath } = useParams<{ accountId?: string; branchPath?: string }>();
  const [hasSlideshows, setHasSlideshows] = useState(false);
  const [hasVideos, setHasVideos] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [hasNewsTicker, setHasNewsTicker] = useState(false);
  const [hasBreakTimer, setHasBreakTimer] = useState(false);

  // Parse branch ID from URL path (e.g., "jed", "ryd", etc.)
  const branchId = branchPath?.startsWith('/') ? branchPath.slice(1) : branchPath;

  // Get account ID from URL or localStorage for TV mode
  const currentAccountId = accountId || localStorage.getItem('tv_account_id');
  const currentBranchId = branchId || localStorage.getItem('tv_branch_id');

  console.log('🏪 Client Public Page - Account:', currentAccountId, 'Branch:', currentBranchId);

  useEffect(() => {
    // Store current account and branch for TV mode
    if (currentAccountId) {
      localStorage.setItem('tv_account_id', currentAccountId);
    }
    if (currentBranchId) {
      localStorage.setItem('tv_branch_id', currentBranchId);
    } else {
      localStorage.removeItem('tv_branch_id');
    }
  }, [currentAccountId, currentBranchId]);

  const handleSlideshowActivity = (isActive: boolean) => {
    console.log('📺 Slideshow activity changed:', isActive, 'for branch:', currentBranchId || 'main');
    setHasSlideshows(isActive);
  };

  const handleVideoActivity = (isActive: boolean) => {
    console.log('🎥 Video activity changed:', isActive, 'for branch:', currentBranchId || 'main');
    setHasVideos(isActive);
  };

  const handleNotificationActivity = (isActive: boolean) => {
    console.log('📢 Notification activity changed:', isActive, 'for branch:', currentBranchId || 'main');
    setHasNotifications(isActive);
  };

  const handleNewsTickerActivity = (isActive: boolean) => {
    console.log('📰 News ticker activity changed:', isActive, 'for branch:', currentBranchId || 'main');
    setHasNewsTicker(isActive);
  };

  const handleBreakTimerActivity = (isActive: boolean) => {
    console.log('⏱️ Break timer activity changed:', isActive, 'for branch:', currentBranchId || 'main');
    setHasBreakTimer(isActive);
  };

  if (!currentAccountId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">مرحباً بك في نظام العرض</h1>
          <p className="text-gray-300">يرجى تحديد معطى الحساب للمتابعة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Priority order: Videos > Slideshows > Break Timer */}
      {hasVideos && (
        <VideoDisplay 
          accountId={currentAccountId}
          branchId={currentBranchId}
          onActivityChange={handleVideoActivity}
        />
      )}
      
      {!hasVideos && hasSlideshows && (
        <SlideshowDisplay 
          accountId={currentAccountId}
          branchId={currentBranchId}
          onActivityChange={handleSlideshowActivity}
        />
      )}
      
      {!hasVideos && !hasSlideshows && hasBreakTimer && (
        <BreakTimerDisplay 
          accountId={currentAccountId}
          branchId={currentBranchId}
          onActivityChange={handleBreakTimerActivity}
        />
      )}

      {/* Overlays - always show if active */}
      {hasNotifications && (
        <NotificationDisplay 
          accountId={currentAccountId}
          branchId={currentBranchId}
          onActivityChange={handleNotificationActivity}
        />
      )}
      
      {hasNewsTicker && (
        <NewsTickerDisplay 
          accountId={currentAccountId}
          branchId={currentBranchId}
          onActivityChange={handleNewsTickerActivity}
        />
      )}

      {/* Default content when nothing is active */}
      {!hasVideos && !hasSlideshows && !hasBreakTimer && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-4xl">📺</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">نظام العرض</h1>
              <p className="text-xl text-gray-300 mb-2">جاهز للعرض</p>
              {currentBranchId && (
                <p className="text-lg text-blue-300">فرع: {currentBranchId}</p>
              )}
              {!currentBranchId && (
                <p className="text-lg text-green-300">الحساب الرئيسي</p>
              )}
            </div>
            <div className="text-sm text-gray-400">
              <p>معرف الحساب: {currentAccountId}</p>
              <p>في انتظار المحتوى...</p>
            </div>
          </div>
        </div>
      )}

      {/* Development info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs z-50">
          <div>Account: {currentAccountId}</div>
          <div>Branch: {currentBranchId || 'Main'}</div>
          <div>Videos: {hasVideos ? '✅' : '❌'}</div>
          <div>Slideshows: {hasSlideshows ? '✅' : '❌'}</div>
          <div>Notifications: {hasNotifications ? '✅' : '❌'}</div>
          <div>News: {hasNewsTicker ? '✅' : '❌'}</div>
          <div>Break Timer: {hasBreakTimer ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
};

export default ClientPublicPage;
