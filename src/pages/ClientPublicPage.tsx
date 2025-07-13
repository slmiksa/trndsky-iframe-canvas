
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SlideshowDisplay from '@/components/SlideshowDisplay';
import VideoDisplay from '@/components/VideoDisplay';
import NotificationDisplay from '@/components/NotificationDisplay';
import NewsTickerDisplay from '@/components/NewsTickerDisplay';
import BreakTimerDisplayContainer from '@/components/BreakTimerDisplayContainer';

const ClientPublicPage: React.FC = () => {
  const { accountId, branchPath } = useParams<{ accountId?: string; branchPath?: string }>();
  const [hasSlideshows, setHasSlideshows] = useState(false);
  const [hasVideos, setHasVideos] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [hasNewsTicker, setHasNewsTicker] = useState(false);
  const [hasBreakTimer, setHasBreakTimer] = useState(false);
  const [hasWebsites, setHasWebsites] = useState(false);
  const [activeWebsite, setActiveWebsite] = useState<any>(null);

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

  // Check for active websites with proper branch filtering
  const checkActiveWebsites = async () => {
    if (!currentAccountId) return;

    try {
      console.log('🔍 Checking active websites for account:', currentAccountId, 'branch:', currentBranchId);
      
      const { data, error } = await supabase
        .from('account_websites')
        .select('*')
        .eq('account_id', currentAccountId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error fetching websites:', error);
        return;
      }

      console.log('📊 All active websites:', data);

      // Filter websites based on branch association stored in localStorage
      let activeWebsiteData = null;
      let hasActiveWebsite = false;
      
      if (data && data.length > 0) {
        if (currentBranchId) {
          // Looking for branch-specific content
          console.log('🔍 Looking for websites assigned to branch:', currentBranchId);
          
          for (const website of data) {
            const websiteBranchId = localStorage.getItem(`website_branch_${website.id}`);
            console.log(`Website ${website.id} (${website.website_title}) branch assignment:`, websiteBranchId);
            
            if (websiteBranchId === currentBranchId) {
              activeWebsiteData = website;
              hasActiveWebsite = true;
              console.log('✅ Found branch-specific website:', website.website_title);
              break;
            }
          }
        } else {
          // Looking for main account content (no branch assignment)
          console.log('🔍 Looking for main account websites (no branch assignment)');
          
          for (const website of data) {
            const websiteBranchId = localStorage.getItem(`website_branch_${website.id}`);
            console.log(`Website ${website.id} (${website.website_title}) branch assignment:`, websiteBranchId);
            
            if (!websiteBranchId || websiteBranchId === '') {
              activeWebsiteData = website;
              hasActiveWebsite = true;
              console.log('✅ Found main account website:', website.website_title);
              break;
            }
          }
        }
      }

      setActiveWebsite(activeWebsiteData);
      setHasWebsites(hasActiveWebsite);
      
      console.log('🌐 Final result - Active website for branch:', currentBranchId || 'main', 
                  activeWebsiteData ? activeWebsiteData.website_title : 'none');
      console.log('🌐 Has active websites:', hasActiveWebsite);
      
    } catch (error) {
      console.error('❌ Error in checkActiveWebsites:', error);
    }
  };

  useEffect(() => {
    checkActiveWebsites();
    
    // Set up interval to check for website changes
    const interval = setInterval(checkActiveWebsites, 10000);
    return () => clearInterval(interval);
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
      {/* Priority order: Websites > Videos > Slideshows > Break Timer */}
      {hasWebsites && activeWebsite && (
        <div className="fixed inset-0 z-40">
          <iframe
            src={activeWebsite.website_url}
            className="w-full h-full border-0"
            title={activeWebsite.website_title || 'Website Display'}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          />
          
          {/* Website info overlay */}
          <div className="absolute top-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 z-50">
            <h2 className="text-white text-xl font-semibold">{activeWebsite.website_title || 'موقع ويب'}</h2>
            <div className="text-white/80 text-sm">
              <p>موقع نشط</p>
              {currentBranchId && <p className="text-xs text-blue-300">فرع: {currentBranchId}</p>}
              {!currentBranchId && <p className="text-xs text-green-300">الحساب الرئيسي</p>}
            </div>
          </div>
        </div>
      )}
      
      {!hasWebsites && hasVideos && (
        <VideoDisplay 
          accountId={currentAccountId}
          branchId={currentBranchId}
          onActivityChange={handleVideoActivity}
        />
      )}
      
      {!hasWebsites && !hasVideos && hasSlideshows && (
        <SlideshowDisplay 
          accountId={currentAccountId}
          branchId={currentBranchId}
          onActivityChange={handleSlideshowActivity}
        />
      )}
      
      {!hasWebsites && !hasVideos && !hasSlideshows && hasBreakTimer && (
        <BreakTimerDisplayContainer 
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
      {!hasWebsites && !hasVideos && !hasSlideshows && !hasBreakTimer && (
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
              {currentBranchId && (
                <p className="text-yellow-300 mt-2">تحقق من تخصيص المحتوى للفرع في لوحة التحكم</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Development info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs z-50">
          <div>Account: {currentAccountId}</div>
          <div>Branch: {currentBranchId || 'Main'}</div>
          <div>Websites: {hasWebsites ? '✅' : '❌'}</div>
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
