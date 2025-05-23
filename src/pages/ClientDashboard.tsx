
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Globe, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Website {
  id: string;
  website_url: string;
  website_title: string | null;
  is_active: boolean;
  created_at: string;
}

const ClientDashboard = () => {
  const { signOut, accountId } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebsite, setNewWebsite] = useState({
    url: '',
    title: '',
  });
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);

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
                  <CardTitle>مواقعي</CardTitle>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة موقع
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddForm && (
                  <form onSubmit={addWebsite} className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">عنوان الموقع</Label>
                        <Input
                          id="title"
                          value={newWebsite.title}
                          onChange={(e) => setNewWebsite({...newWebsite, title: e.target.value})}
                          placeholder="اختياري"
                        />
                      </div>
                      <div>
                        <Label htmlFor="url">رابط الموقع</Label>
                        <Input
                          id="url"
                          type="url"
                          value={newWebsite.url}
                          onChange={(e) => setNewWebsite({...newWebsite, url: e.target.value})}
                          required
                          dir="ltr"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button type="submit" disabled={loading}>
                        إضافة الموقع
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {websites.map((website) => (
                    <div 
                      key={website.id} 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedWebsite?.id === website.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedWebsite(website)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {website.website_title || 'موقع بدون عنوان'}
                          </h3>
                          <p className="text-sm text-gray-600 break-all">{website.website_url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={website.is_active ? 'default' : 'secondary'}>
                            {website.is_active ? 'نشط' : 'معطل'}
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
                        </div>
                      </div>
                    </div>
                  ))}

                  {websites.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لم تقم بإضافة أي مواقع بعد</p>
                      <p className="text-sm">انقر على "إضافة موقع" للبدء</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* معاينة الموقع */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>معاينة الموقع</CardTitle>
                  {selectedWebsite && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteWebsite(selectedWebsite.id)}
                    >
                      حذف الموقع
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="h-96">
                {selectedWebsite ? (
                  selectedWebsite.is_active ? (
                    <iframe
                      src={selectedWebsite.website_url}
                      className="w-full h-full border rounded-lg"
                      title={selectedWebsite.website_title || 'Website Preview'}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                      <div className="text-center text-gray-500">
                        <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>الموقع معطل</p>
                        <p className="text-sm">قم بتفعيله لمعاينته</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
