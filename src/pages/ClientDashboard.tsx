
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Settings, Users, Image, Video, MessageSquare, Clock, MapPin, Globe, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

// Import managers
import SlideshowManager from '@/components/SlideshowManager';
import VideoManager from '@/components/VideoManager';
import NotificationManager from '@/components/NotificationManager';
import NewsTickerManager from '@/components/NewsTickerManager';
import BreakTimerManager from '@/components/BreakTimerManager';
import BranchManager from '@/components/BranchManager';
import BranchPublicLinks from '@/components/BranchPublicLinks';
import WebsiteManager from '@/components/WebsiteManager';

interface Account {
  id: string;
  name: string;
  email: string;
  database_name: string;
  status: 'active' | 'suspended' | 'pending';
  is_subscription_active: boolean;
  activation_start_date: string | null;
  activation_end_date: string | null;
}

interface Branch {
  id: string;
  branch_name: string;
  branch_path: string;
  is_active: boolean;
  created_at: string;
  account_id: string;
}

const ClientDashboard: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const { user, userRole, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [account, setAccount] = useState<Account | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated and has the right role
  useEffect(() => {
    if (!authLoading && (!user || userRole !== 'account_user')) {
      console.log('❌ Unauthorized access to dashboard');
    }
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (accountId && !authLoading && user && userRole === 'account_user') {
      console.log('🔍 Loading dashboard for account:', accountId);
      loadAccountData();
      loadBranches();
      
      // Load selected branch from localStorage
      const savedBranchId = localStorage.getItem(`selected_branch_${accountId}`);
      if (savedBranchId) {
        setSelectedBranchId(savedBranchId);
      }
    }
  }, [accountId, authLoading, user, userRole]);

  const loadAccountData = async () => {
    try {
      console.log('🔍 Loading account data for:', accountId);
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) {
        console.error('❌ Error loading account:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Account not found');
      }

      setAccount(data as Account);
      console.log('✅ Account loaded:', data);
    } catch (error: any) {
      console.error('Error loading account:', error);
      setError(error.message);
      toast({
        title: t('error') || "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadBranches = async () => {
    try {
      console.log('🔍 Loading branches for account:', accountId);
      
      // Use type assertion to work around missing types
      const { data, error } = await (supabase as any)
        .from('account_branches')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error loading branches:', error);
        // Don't throw error for branches as it's not critical
      } else {
        setBranches(data || []);
        console.log('✅ Branches loaded:', data);
      }
    } catch (error: any) {
      console.error('Error loading branches:', error);
      // Don't show error toast for branches as it's not critical
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelect = (branchId: string | null) => {
    console.log('🔄 Branch selection changed to:', branchId);
    setSelectedBranchId(branchId);
    
    // Store in localStorage for persistence
    if (branchId) {
      localStorage.setItem(`selected_branch_${accountId}`, branchId);
    } else {
      localStorage.removeItem(`selected_branch_${accountId}`);
    }
  };

  const openPublicPage = () => {
    if (!account) return;
    
    let url = `/client/${account.database_name}`;
    if (selectedBranchId) {
      const branch = branches.find(b => b.id === selectedBranchId);
      if (branch) {
        url += `/${branch.branch_path}`;
      }
    }
    
    window.open(url, '_blank');
  };

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to check if subscription is expiring soon
  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  // Helper function to check if subscription is expired
  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    return end.getTime() < now.getTime();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading') || 'جاري التحميل'}...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'account_user') {
    return <Navigate to="/login" replace />;
  }

  if (error || !account) {
    return <Navigate to="/login" replace />;
  }

  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('dashboard_title') || 'لوحة تحكم'} {account.name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                  {account.status === 'active' ? (t('active') || 'نشط') : (t('inactive') || 'معطل')}
                </Badge>
                
                {/* Subscription Status */}
                {account.is_subscription_active ? (
                  <Badge 
                    variant={
                      isExpired(account.activation_end_date) ? 'destructive' : 
                      isExpiringSoon(account.activation_end_date) ? 'secondary' : 'default'
                    }
                    className="flex items-center gap-1"
                  >
                    <Calendar className="h-3 w-3" />
                    {isExpired(account.activation_end_date) ? 
                      (t('subscription_expired') || 'انتهت الصلاحية') :
                      isExpiringSoon(account.activation_end_date) ?
                      (t('expiring_soon') || 'تنتهي قريباً') :
                      (t('subscription_active') || 'اشتراك نشط')
                    }
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {t('subscription_inactive') || 'اشتراك غير نشط'}
                  </Badge>
                )}

                {/* Expiration Date */}
                {account.activation_end_date && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('expires_on') || 'ينتهي في'}: {formatDate(account.activation_end_date)}
                  </Badge>
                )}
                
                {selectedBranchId && selectedBranch && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedBranch.branch_name}
                  </Badge>
                )}
                {!selectedBranchId && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    {t('main_account') || 'الحساب الرئيسي'}
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={openPublicPage} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              {t('view_public_page') || 'عرض الصفحة العامة'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Branch Management */}
            <BranchManager
              accountId={accountId!}
              onBranchSelect={handleBranchSelect}
              selectedBranchId={selectedBranchId}
            />
            
            {/* Public Links */}
            <BranchPublicLinks
              accountName={account.database_name}
              branches={branches}
              selectedBranchId={selectedBranchId}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="slideshows" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="slideshows" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  {t('slideshows') || 'العروض'}
                </TabsTrigger>
                <TabsTrigger value="videos" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  {t('videos') || 'الفيديوهات'}
                </TabsTrigger>
                <TabsTrigger value="websites" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('websites') || 'المواقع'}
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('notifications') || 'الإشعارات'}
                </TabsTrigger>
                <TabsTrigger value="news" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('news') || 'الأخبار'}
                </TabsTrigger>
                <TabsTrigger value="timers" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('timers') || 'المؤقتات'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="slideshows">
                <SlideshowManager 
                  accountId={accountId!} 
                  branchId={selectedBranchId}
                />
              </TabsContent>

              <TabsContent value="videos">
                <VideoManager 
                  accountId={accountId!} 
                  branchId={selectedBranchId}
                />
              </TabsContent>

              <TabsContent value="websites">
                <WebsiteManager 
                  accountId={accountId!} 
                  branchId={selectedBranchId}
                />
              </TabsContent>

              <TabsContent value="notifications">
                <NotificationManager 
                  accountId={accountId!} 
                  branchId={selectedBranchId}
                />
              </TabsContent>

              <TabsContent value="news">
                <NewsTickerManager 
                  accountId={accountId!} 
                  branchId={selectedBranchId}
                />
              </TabsContent>

              <TabsContent value="timers">
                <BreakTimerManager 
                  accountId={accountId!} 
                  branchId={selectedBranchId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
