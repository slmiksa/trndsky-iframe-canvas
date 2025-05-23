import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Globe, Eye, EyeOff, ExternalLink, Share2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Website {
  id: string;
  website_url: string;
  website_title: string | null;
  is_active: boolean;
  created_at: string;
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

  // Fetch account name for public page link
  const fetchAccountName = async () => {
    if (!accountId) return;
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('name')
        .eq('id', accountId)
        .single();

      if (error) {
        console.error('❌ Error fetching account name:', error);
        return;
      }

      console.log('✅ Account name fetched:', data.name);
      setAccountName(data.name);
    } catch (error) {
      console.error('❌ Error in fetchAccountName:', error);
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

  useEffect(() => {
    fetchWebsites();
    fetchAccountName();
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
      toast({
        title: "تم إضافة الموقع بنجاح",
        description: `تم إضافة ${newWebsite.title || newWebsite.url}`,
      });

      setNewWebsite({ url: '', title: '' });
      setShowAddForm(false);
      fetchWebsites();
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
      toast({
        title: "تم تحديث حالة الموقع",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} الموقع`,
      });

      fetchWebsites();
    } catch (error: any) {
      console.error('❌ Error in toggleWebsiteStatus:', error);
      toast({
        title: "خطأ في تحديث الموقع",
        description: error.message,
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
      toast({
        title: "تم حذف الموقع",
        description: "تم حذف الموقع بنجاح",
      });

      setSelectedWebsite(null);
      fetchWebsites();
    } catch (error: any) {
      console.error('❌ Error in deleteWebsite:', error);
      toast({
        title: "خطأ في حذف الموقع",
        description: error.message,
        variant: "destructive",
      });
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
      </main>
    </div>
  );
};

export default ClientDashboard;
