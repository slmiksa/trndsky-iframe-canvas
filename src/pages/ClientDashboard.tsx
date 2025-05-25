import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Globe, Eye, EyeOff, ExternalLink, Share2, Trash2, Bell, Clock, Settings, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationManager from '@/components/NotificationManager';
import BreakTimerManager from '@/components/BreakTimerManager';
import GalleryManager from '@/components/GalleryManager';
import AccountStatusCard from '@/components/AccountStatusCard';
import Footer from '@/components/Footer';
import { Slider } from '@/components/ui/slider';

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
  rotation_interval: number;
}

const ClientDashboard = () => {
  const { signOut, accountId, user } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebsite, setNewWebsite] = useState({
    url: '',
    title: '',
  });
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [accountName, setAccountName] = useState<string>('');
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [rotationInterval, setRotationInterval] = useState<number>(30);
  const [savingInterval, setSavingInterval] = useState(false);

  // Fetch account information including subscription details
  const fetchAccountInfo = async () => {
    if (!accountId) return;
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('name, activation_start_date, activation_end_date, status, rotation_interval')
        .eq('id', accountId)
        .single();

      if (error) {
        console.error('❌ Error fetching account info:', error);
        return;
      }

      console.log('✅ Account info fetched:', data);
      setAccountName(data.name);
      setAccountInfo({
        activation_start_date: data.activation_start_date,
        activation_end_date: data.activation_end_date,
        status: data.status,
        rotation_interval: data.rotation_interval || 30
      });
      setRotationInterval(data.rotation_interval || 30);
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
      const { data, error } = await supabase
        .from('account_websites')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

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
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // إعداد التحديثات الفورية للوحة التحكم
  useEffect(() => {
    if (!accountId) return;

    // جلب البيانات الأولية
    fetchWebsites();
    fetchAccountInfo();

    console.log('🎯 إعداد التحديثات الفورية للوحة التحكم');

    // إعداد مستمع التحديثات الفورية للمواقع
    const websiteChannelName = `admin-websites-${accountId}`;
    const websiteChannel = supabase
      .channel(websiteChannelName)
      .on(
        'postgres_changes',
        {
          event: '*', // جميع الأحداث: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'account_websites',
          filter: `account_id=eq.${accountId}`
        },
        (payload) => {
          console.log('🔄 تحديث فوري في لوحة التحكم:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newWebsite = payload.new as Website;
            console.log('➕ إضافة موقع جديد:', newWebsite);
            setWebsites(prev => [newWebsite, ...prev]);
            
            toast({
              title: "تم إضافة موقع جديد",
              description: `تم إضافة ${newWebsite.website_title || newWebsite.website_url} بنجاح`,
            });
          } 
          else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedWebsite = payload.new as Website;
            console.log('🔄 تحديث موقع:', updatedWebsite);
            
            setWebsites(prev => prev.map(website => 
              website.id === updatedWebsite.id ? updatedWebsite : website
            ));
            
            // تحديث الموقع المحدد إذا كان هو المعروض
            setSelectedWebsite(prev => 
              prev?.id === updatedWebsite.id ? updatedWebsite : prev
            );
            
            const statusText = updatedWebsite.is_active ? 'تم تفعيل' : 'تم إيقاف';
            toast({
              title: "تم تحديث حالة الموقع",
              description: `${statusText} ${updatedWebsite.website_title || updatedWebsite.website_url}`,
            });
          }
          else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedWebsite = payload.old as Website;
            console.log('🗑️ حذف موقع:', deletedWebsite);
            
            setWebsites(prev => prev.filter(website => website.id !== deletedWebsite.id));
            
            // إزالة التحديد إذا كان الموقع المحذوف هو المعروض
            setSelectedWebsite(prev => 
              prev?.id === deletedWebsite.id ? null : prev
            );
            
            toast({
              title: "تم حذف الموقع",
              description: `تم حذف ${deletedWebsite.website_title || deletedWebsite.website_url}`,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة اشتراك التحديثات الفورية للوحة التحكم:', status);
      });

    // إعداد مستمع لتحديثات فترة التبديل
    const accountChannelName = `admin-account-${accountId}`;
    const accountChannel = supabase
      .channel(accountChannelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'accounts',
          filter: `id=eq.${accountId}`
        },
        (payload) => {
          console.log('🔄 تحديث بيانات الحساب في لوحة التحكم:', payload.new);
          
          const newData = payload.new as any;
          if (newData?.rotation_interval !== undefined) {
            console.log('⏱️ تحديث فترة التبديل:', newData.rotation_interval);
            setRotationInterval(newData.rotation_interval);
            setAccountInfo(prev => prev ? { ...prev, rotation_interval: newData.rotation_interval } : null);
          }
        }
      )
      .subscribe();

    // تنظيف المستمعات عند الإلغاء
    return () => {
      console.log('🧹 تنظيف مستمعات التحديثات الفورية للوحة التحكم');
      supabase.removeChannel(websiteChannel);
      supabase.removeChannel(accountChannel);
    };
  }, [accountId]);

  const addWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على معرف الحساب",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('➕ Adding new website:', { accountId, url: newWebsite.url, title: newWebsite.title });
      
      const { error } = await supabase
        .from('account_websites')
        .insert({
          account_id: accountId,
          website_url: newWebsite.url,
          website_title: newWebsite.title || null,
          is_active: true,
        });

      if (error) {
        console.error('❌ Error inserting website:', error);
        throw error;
      }

      console.log('✅ Website added successfully');
      
      setNewWebsite({ url: '', title: '' });
      setShowAddForm(false);
      
      // لا حاجة لجلب البيانات يدوياً - ستأتي عبر realtime
    } catch (error: any) {
      console.error('❌ Error in addWebsite:', error);
      toast({
        title: "خطأ في إضافة الموقع",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWebsiteStatus = async (websiteId: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Toggling website status:', { websiteId, currentStatus });

      const { error } = await supabase
        .from('account_websites')
        .update({ is_active: !currentStatus })
        .eq('id', websiteId);

      if (error) {
        console.error('❌ Error updating website status:', error);
        throw error;
      }

      console.log('✅ Website status updated successfully');
      
      // لا حاجة لتحديث البيانات يدوياً - ستأتي عبر realtime

    } catch (error: any) {
      console.error('❌ Error in toggleWebsiteStatus:', error);
      
      let errorMessage = 'حدث خطأ غير متوقع';
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'مشكلة في الاتصال بالإنترنت - يرجى التحقق من الاتصال والمحاولة مرة أخرى';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'انتهت مهلة الاتصال - يرجى المحاولة مرة أخرى';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "خطأ في تحديث حالة الموقع",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteWebsite = async (websiteId: string) => {
    try {
      console.log('🗑️ Deleting website:', websiteId);
      
      const { error } = await supabase
        .from('account_websites')
        .delete()
        .eq('id', websiteId);

      if (error) {
        console.error('❌ Error deleting website:', error);
        throw error;
      }

      console.log('✅ Website deleted successfully');
      
      // لا حاجة لتحديث البيانات يدوياً - ستأتي عبر realtime

    } catch (error: any) {
      console.error('❌ Error in deleteWebsite:', error);
      
      let errorMessage = 'حدث خطأ في حذف الموقع';
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'مشكلة في الاتصال بالإنترنت - يرجى التحقق من الاتصال والمحاولة مرة أخرى';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "خطأ في حذف الموقع",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateRotationInterval = async () => {
    if (!accountId) return;
    
    setSavingInterval(true);
    
    try {
      console.log('🔄 Updating rotation interval:', rotationInterval);
      
      const { error } = await supabase
        .from('accounts')
        .update({ rotation_interval: rotationInterval })
        .eq('id', accountId);

      if (error) {
        console.error('❌ Error updating rotation interval:', error);
        throw error;
      }

      console.log('✅ Rotation interval updated successfully');
      toast({
        title: "تم تحديث فترة تبديل المواقع",
        description: `تم تحديث فترة التبديل إلى ${rotationInterval} ثانية`,
      });
      
      // Update local state to reflect the change
      setAccountInfo(prev => prev ? { ...prev, rotation_interval: rotationInterval } : null);
      
    } catch (error: any) {
      console.error('❌ Error in updateRotationInterval:', error);
      toast({
        title: "خطأ في تحديث فترة التبديل",
        description: error.message,
        variant: "destructive",
      });
      
      // Reset to previous value on error
      if (accountInfo) {
        setRotationInterval(accountInfo.rotation_interval);
      }
    } finally {
      setSavingInterval(false);
    }
  };

  const copyPublicLink = () => {
    if (accountName) {
      const publicUrl = `${window.location.origin}/client/${accountName}`;
      navigator.clipboard.writeText(publicUrl);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط الصفحة العامة إلى الحافظة",
      });
    }
  };

  const openPublicPage = () => {
    if (accountName) {
      const publicUrl = `/client/${accountName}`;
      window.open(publicUrl, '_blank');
    }
  };

  // Format time helper
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} ثانية`;
    return `${Math.floor(seconds / 60)} دقيقة${seconds % 60 > 0 ? ` و ${seconds % 60} ثانية` : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم العميل</h1>
              {accountId && (
                <p className="text-sm text-gray-600">معرف الحساب: {accountId}</p>
              )}
              {accountName && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    الصفحة العامة: /client/{accountName}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={copyPublicLink}>
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={openPublicPage}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <Button onClick={signOut} variant="outline">
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Status Card */}
        {accountInfo && (
          <div className="mb-6">
            <AccountStatusCard
              activationStartDate={accountInfo.activation_start_date}
              activationEndDate={accountInfo.activation_end_date}
              status={accountInfo.status}
              accountName={accountName}
            />
          </div>
        )}

        <Tabs defaultValue="websites" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="websites" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              المواقع
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              معرض الصور
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              الإشعارات
            </TabsTrigger>
            <TabsTrigger value="timers" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              مؤقتات البريك
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="websites">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* قائمة المواقع */}
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>
                        المواقع ({websites.length})
                      </CardTitle>
                      <Button onClick={() => setShowAddForm(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة موقع
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2 text-gray-600">جاري التحميل...</p>
                      </div>
                    ) : websites.length === 0 ? (
                      <div className="text-center py-8">
                        <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">لا توجد مواقع بعد</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {websites.map((website) => (
                          <div
                            key={website.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedWebsite?.id === website.id
                                ? 'bg-blue-50 border-blue-200'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedWebsite(website)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">
                                {website.website_title || 'موقع بدون عنوان'}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant={website.is_active ? "default" : "secondary"}>
                                  {website.is_active ? 'نشط' : 'متوقف'}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWebsiteStatus(website.id, website.is_active);
                                  }}
                                >
                                  {website.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteWebsite(website.id);
                                  }}
                                >
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
                          </div>
                        ))}
                      </div>
                    )}

                    {/* نموذج إضافة موقع */}
                    {showAddForm && (
                      <div className="mt-6 border-t pt-6">
                        <form onSubmit={addWebsite} className="space-y-4">
                          <div>
                            <Label htmlFor="url">رابط الموقع</Label>
                            <Input
                              id="url"
                              type="url"
                              value={newWebsite.url}
                              onChange={(e) => setNewWebsite({ ...newWebsite, url: e.target.value })}
                              placeholder="https://example.com"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="title">عنوان الموقع (اختياري)</Label>
                            <Input
                              id="title"
                              type="text"
                              value={newWebsite.title}
                              onChange={(e) => setNewWebsite({ ...newWebsite, title: e.target.value })}
                              placeholder="اسم الموقع"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                              إضافة
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowAddForm(false);
                                setNewWebsite({ url: '', title: '' });
                              }}
                            >
                              إلغاء
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* معاينة الموقع */}
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>
                      {selectedWebsite ? (selectedWebsite.website_title || 'معاينة الموقع') : 'معاينة الموقع'}
                    </CardTitle>
                    {selectedWebsite && (
                      <p className="text-sm text-gray-600 break-all">
                        {selectedWebsite.website_url}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="h-96 lg:h-[500px]">
                    {selectedWebsite ? (
                      <iframe
                        src={selectedWebsite.website_url}
                        className="w-full h-full border rounded-lg"
                        title={selectedWebsite.website_title || 'Website Preview'}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                        <div className="text-center text-gray-500">
                          <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>اختر موقعاً لمعاينته</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery">
            {accountId && <GalleryManager accountId={accountId} />}
          </TabsContent>

          <TabsContent value="notifications">
            {accountId && <NotificationManager accountId={accountId} />}
          </TabsContent>

          <TabsContent value="timers">
            {accountId && <BreakTimerManager accountId={accountId} />}
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات عرض المواقع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">فترة تبديل المواقع</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <Label className="text-gray-700 mb-2">فترة التبديل: {formatTime(rotationInterval)}</Label>
                        <div className="flex gap-4 items-center">
                          <span className="text-sm text-gray-500">10 ثانية</span>
                          <Slider 
                            value={[rotationInterval]} 
                            min={10} 
                            max={300} 
                            step={5} 
                            className="flex-grow" 
                            onValueChange={(values) => setRotationInterval(values[0])}
                          />
                          <span className="text-sm text-gray-500">5 دقائق</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          حدد فترة التبديل بين المواقع (من 10 ثواني إلى 5 دقائق)
                        </p>
                      </div>
                      
                      <Button 
                        onClick={updateRotationInterval} 
                        disabled={loading || savingInterval || (accountInfo?.rotation_interval === rotationInterval)}
                      >
                        {savingInterval ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            جاري الحفظ...
                          </>
                        ) : 'حفظ فترة التبديل'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ClientDashboard;
