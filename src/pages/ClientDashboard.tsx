import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Globe, Eye, EyeOff, ExternalLink, Share2, Trash2, Bell, Clock, Info, Newspaper, Images, Video, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import NotificationManager from '@/components/NotificationManager';
import BreakTimerManager from '@/components/BreakTimerManager';
import NewsTickerManager from '@/components/NewsTickerManager';
import SlideshowManager from '@/components/SlideshowManager';
import VideoManager from '@/components/VideoManager';
import BranchManager from '@/components/BranchManager';
import AccountStatusCard from '@/components/AccountStatusCard';
import LanguageToggle from '@/components/LanguageToggle';
import Footer from '@/components/Footer';
interface Website {
  id: string;
  website_url: string;
  website_title: string | null;
  is_active: boolean;
  created_at: string;
}
interface AccountInfo {
  activation_start_date: string | null;
  activation_end_date: string | null;
  status: 'active' | 'suspended' | 'pending';
}
const ClientDashboard = () => {
  const {
    signOut,
    accountId,
    user
  } = useAuth();
  const {
    t
  } = useLanguage();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebsite, setNewWebsite] = useState({
    url: '',
    title: ''
  });
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [accountName, setAccountName] = useState<string>('');
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);

  // Fetch account information including subscription details
  const fetchAccountInfo = async () => {
    if (!accountId) return;
    try {
      const {
        data,
        error
      } = await supabase.from('accounts').select('name, activation_start_date, activation_end_date, status').eq('id', accountId).single();
      if (error) {
        console.error('❌ Error fetching account info:', error);
        return;
      }
      console.log('✅ Account info fetched:', data);
      setAccountName(data.name);
      setAccountInfo({
        activation_start_date: data.activation_start_date,
        activation_end_date: data.activation_end_date,
        status: data.status
      });
    } catch (error) {
      console.error('❌ Error in fetchAccountInfo:', error);
    }
  };
  const fetchWebsites = async () => {
    if (!accountId) {
      console.log('⚠️ No account ID available for fetching websites');
      return;
    }
    try {
      console.log('🔍 Fetching websites for account:', accountId);
      const {
        data,
        error
      } = await supabase.from('account_websites').select('*').eq('account_id', accountId).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('❌ Error fetching websites:', error);
        throw error;
      }
      console.log('✅ Websites fetched successfully:', data);
      setWebsites(data || []);
    } catch (error) {
      console.error('❌ Error in fetchWebsites:', error);
      toast({
        title: "خطأ في تحميل المواقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchWebsites();
    fetchAccountInfo();
  }, [accountId]);
  const addWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast({
        title: t('error'),
        description: t('account_id_not_found'),
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      console.log('➕ Adding new website:', {
        accountId,
        url: newWebsite.url,
        title: newWebsite.title
      });
      const {
        error
      } = await supabase.from('account_websites').insert({
        account_id: accountId,
        website_url: newWebsite.url,
        website_title: newWebsite.title || null,
        is_active: false // Changed from true to false - new websites are inactive by default
      });
      if (error) {
        console.error('❌ Error inserting website:', error);
        throw error;
      }
      console.log('✅ Website added successfully');
      toast({
        title: t('website_added_successfully'),
        description: `${newWebsite.title || newWebsite.url}`
      });
      setNewWebsite({
        url: '',
        title: ''
      });
      setShowAddForm(false);
      fetchWebsites();
    } catch (error: any) {
      console.error('❌ Error in addWebsite:', error);
      toast({
        title: t('error_adding_website'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const toggleWebsiteStatus = async (websiteId: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Toggling website status:', {
        websiteId,
        currentStatus
      });
      if (!currentStatus) {
        console.log('🛑 إيقاف جميع المواقع النشطة قبل تفعيل الموقع الجديد');
        const {
          error: deactivateError
        } = await supabase.from('account_websites').update({
          is_active: false
        }).eq('account_id', accountId).eq('is_active', true);
        if (deactivateError) {
          console.error('❌ خطأ في إيقاف المواقع النشطة:', deactivateError);
          throw deactivateError;
        }
        console.log('✅ تم إيقاف جميع المواقع النشطة');
      }
      const {
        error
      } = await supabase.from('account_websites').update({
        is_active: !currentStatus
      }).eq('id', websiteId);
      if (error) {
        console.error('❌ Error updating website status:', error);
        throw error;
      }
      console.log('✅ Website status updated successfully');
      const statusMessage = !currentStatus ? t('website_activated_others_stopped') : t('website_stopped');
      toast({
        title: t('website_status_updated'),
        description: statusMessage
      });
      fetchWebsites();
    } catch (error: any) {
      console.error('❌ Error in toggleWebsiteStatus:', error);
      toast({
        title: t('error_updating_website'),
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const deleteWebsite = async (websiteId: string) => {
    try {
      console.log('🗑️ Deleting website:', websiteId);
      const {
        error
      } = await supabase.from('account_websites').delete().eq('id', websiteId);
      if (error) {
        console.error('❌ Error deleting website:', error);
        throw error;
      }
      console.log('✅ Website deleted successfully');
      toast({
        title: t('website_deleted'),
        description: t('website_deleted_successfully')
      });
      setSelectedWebsite(null);
      fetchWebsites();
    } catch (error: any) {
      console.error('❌ Error in deleteWebsite:', error);
      toast({
        title: t('error_deleting_website'),
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const copyPublicLink = () => {
    if (accountName) {
      const publicUrl = `${window.location.origin}/client/${accountName}`;
      navigator.clipboard.writeText(publicUrl);
      toast({
        title: t('link_copied'),
        description: t('public_page_link_copied')
      });
    }
  };
  const openPublicPage = () => {
    if (accountName) {
      const publicUrl = `/client/${accountName}`;
      window.open(publicUrl, '_blank');
    }
  };
  return <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('client_dashboard')}</h1>
              {accountId && <p className="text-sm text-gray-600">{t('account_id')}: {accountId}</p>}
              {accountName && <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {t('public_page')}: /client/{accountName}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={copyPublicLink}>
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={openPublicPage}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>}
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Button onClick={signOut} variant="outline">
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Status Card */}
        {accountInfo && <div className="mb-6">
            <AccountStatusCard activationStartDate={accountInfo.activation_start_date} activationEndDate={accountInfo.activation_end_date} status={accountInfo.status} accountName={accountName} />
          </div>}

        <Tabs defaultValue="websites" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 gap-1 px-[116px] py-0 my-0 mx-[8px] bg-slate-50">
            <TabsTrigger value="websites" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t('websites')}</span>
              <span className="sm:hidden">{t('websites')}</span>
            </TabsTrigger>
            <TabsTrigger value="slideshows" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
              <Images className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t('slideshows')}</span>
              <span className="sm:hidden">{t('slideshows')}</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
              <Video className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">فيديوهات</span>
              <span className="sm:hidden">فيديو</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t('notifications')}</span>
              <span className="sm:hidden">{t('notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="timers" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t('timers')}</span>
              <span className="sm:hidden">{t('timers')}</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
              <Newspaper className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t('news')}</span>
              <span className="sm:hidden">{t('news')}</span>
            </TabsTrigger>
            <TabsTrigger value="branches" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t('branches_management')}</span>
              <span className="sm:hidden">{t('branches_management')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="websites">
            {/* Important Note Alert */}
            

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* قائمة المواقع */}
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>
                        {t('websites')} ({websites.length})
                      </CardTitle>
                      <Button onClick={() => setShowAddForm(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('add_website')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2 text-gray-600">{t('loading')}</p>
                      </div> : websites.length === 0 ? <div className="text-center py-8">
                        <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">{t('no_websites_yet')}</p>
                      </div> : <div className="space-y-4">
                        {websites.map(website => <div key={website.id} className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedWebsite?.id === website.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`} onClick={() => setSelectedWebsite(website)}>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">
                                {website.website_title || t('no_title_website')}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant={website.is_active ? "default" : "secondary"}>
                                  {website.is_active ? t('active') : t('stopped')}
                                </Badge>
                                <Button size="sm" variant="ghost" onClick={e => {
                            e.stopPropagation();
                            toggleWebsiteStatus(website.id, website.is_active);
                          }}>
                                  {website.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={e => {
                            e.stopPropagation();
                            deleteWebsite(website.id);
                          }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 break-all mb-2">
                              {website.website_url}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(website.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>)}
                      </div>}

                    {/* نموذج إضافة موقع */}
                    {showAddForm && <div className="mt-6 border-t pt-6">
                        <form onSubmit={addWebsite} className="space-y-4">
                          <div>
                            <Label htmlFor="url">{t('website_url')}</Label>
                            <Input id="url" type="url" value={newWebsite.url} onChange={e => setNewWebsite({
                          ...newWebsite,
                          url: e.target.value
                        })} placeholder="https://example.com" required />
                          </div>
                          <div>
                            <Label htmlFor="title">{t('website_title')}</Label>
                            <Input id="title" type="text" value={newWebsite.title} onChange={e => setNewWebsite({
                          ...newWebsite,
                          title: e.target.value
                        })} placeholder={t('website_name')} />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                              {t('add')}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => {
                          setShowAddForm(false);
                          setNewWebsite({
                            url: '',
                            title: ''
                          });
                        }}>
                              {t('cancel')}
                            </Button>
                          </div>
                        </form>
                      </div>}
                  </CardContent>
                </Card>
              </div>

              {/* معاينة الموقع */}
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>
                      {selectedWebsite ? selectedWebsite.website_title || t('website_preview') : t('website_preview')}
                    </CardTitle>
                    {selectedWebsite && <p className="text-sm text-gray-600 break-all">
                        {selectedWebsite.website_url}
                      </p>}
                  </CardHeader>
                  <CardContent className="h-96 lg:h-[500px]">
                    {selectedWebsite ? <iframe src={selectedWebsite.website_url} className="w-full h-full border rounded-lg" title={selectedWebsite.website_title || 'Website Preview'} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" /> : <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                        <div className="text-center text-gray-500">
                          <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>{t('select_website_preview')}</p>
                        </div>
                      </div>}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="slideshows">
            {accountId && <SlideshowManager accountId={accountId} />}
          </TabsContent>

          <TabsContent value="videos">
            {accountId && <VideoManager accountId={accountId} />}
          </TabsContent>

          <TabsContent value="notifications">
            {accountId && <NotificationManager accountId={accountId} />}
          </TabsContent>

          <TabsContent value="timers">
            {accountId && <BreakTimerManager accountId={accountId} />}
          </TabsContent>

          <TabsContent value="news">
            {accountId && <NewsTickerManager accountId={accountId} />}
          </TabsContent>
          
          <TabsContent value="branches">
            {accountId && <BranchManager accountId={accountId} />}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>;
};
export default ClientDashboard;