
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Globe, ArrowLeft } from 'lucide-react';
import NotificationPopup from '@/components/NotificationPopup';
import { useNotifications } from '@/hooks/useNotifications';

interface Website {
  id: string;
  website_url: string;
  website_title: string | null;
  is_active: boolean;
  created_at: string;
}

interface Account {
  id: string;
  name: string;
  email: string;
}

interface Notification {
  id: string;
  account_id: string;
  title: string;
  message: string | null;
  image_url: string | null;
  is_active: boolean;
  position: string;
  display_duration: number;
  created_at: string;
}

const ClientPublicPage = () => {
  const { clientName } = useParams<{ clientName: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [displayedNotifications, setDisplayedNotifications] = useState<string[]>([]);
  const { fetchActiveNotifications } = useNotifications();

  useEffect(() => {
    if (clientName) {
      fetchClientData();
    }
  }, [clientName]);

  // Set up realtime subscription for notifications
  useEffect(() => {
    if (!account?.id) return;

    console.log('🔔 Setting up realtime subscription for notifications');
    
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `account_id=eq.${account.id}`,
        },
        (payload) => {
          console.log('🔔 Notification change received:', payload);
          loadActiveNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [account?.id]);

  const fetchClientData = async () => {
    try {
      console.log('🔍 Fetching client data for:', clientName);
      
      // Fetch account by name
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id, name, email')
        .eq('name', clientName)
        .eq('status', 'active')
        .single();

      if (accountError) {
        console.error('❌ Error fetching account:', accountError);
        if (accountError.code === 'PGRST116') {
          setError('العميل غير موجود');
        } else {
          throw accountError;
        }
        return;
      }

      console.log('✅ Account found:', accountData);
      setAccount(accountData);

      // Fetch first active website for this account
      const { data: websitesData, error: websitesError } = await supabase
        .from('account_websites')
        .select('*')
        .eq('account_id', accountData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (websitesError) {
        console.error('❌ Error fetching websites:', websitesError);
        throw websitesError;
      }

      console.log('✅ Website fetched:', websitesData);
      
      if (websitesData && websitesData.length > 0) {
        setWebsite(websitesData[0]);
      } else {
        setError('لا توجد مواقع نشطة');
      }

      // Load notifications
      await loadActiveNotifications(accountData.id);

    } catch (error: any) {
      console.error('❌ Error in fetchClientData:', error);
      setError('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveNotifications = async (accountId?: string) => {
    const targetAccountId = accountId || account?.id;
    if (!targetAccountId) return;

    try {
      const notifications = await fetchActiveNotifications(targetAccountId);
      console.log('🔔 Active notifications loaded:', notifications);
      
      // Filter notifications that haven't been displayed yet
      const newNotifications = notifications.filter(
        (notification) => !displayedNotifications.includes(notification.id)
      );
      
      setActiveNotifications(newNotifications);
      
      // Mark new notifications as displayed
      if (newNotifications.length > 0) {
        setDisplayedNotifications(prev => [
          ...prev,
          ...newNotifications.map(n => n.id)
        ]);
      }
    } catch (error) {
      console.error('❌ Error loading active notifications:', error);
    }
  };

  const handleCloseNotification = (notificationId: string) => {
    setActiveNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !account || !website) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-24 w-24 mx-auto mb-4 text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">غير متاح</h1>
          <p className="text-gray-600 mb-6">{error || 'لم يتم العثور على الموقع'}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden relative">
      <iframe
        src={website.website_url}
        className="w-full h-full border-0"
        title={website.website_title || `موقع ${account.name}`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
      />
      
      {/* عرض الإشعارات */}
      {activeNotifications.map((notification) => (
        <NotificationPopup
          key={notification.id}
          notification={notification}
          onClose={() => handleCloseNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default ClientPublicPage;
