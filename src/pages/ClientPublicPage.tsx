
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, ArrowLeft, ExternalLink } from 'lucide-react';

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

const ClientPublicPage = () => {
  const { clientName } = useParams<{ clientName: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientName) {
      fetchClientData();
    }
  }, [clientName]);

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

      // Fetch active websites for this account
      const { data: websitesData, error: websitesError } = await supabase
        .from('account_websites')
        .select('*')
        .eq('account_id', accountData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (websitesError) {
        console.error('❌ Error fetching websites:', websitesError);
        throw websitesError;
      }

      console.log('✅ Websites fetched:', websitesData);
      setWebsites(websitesData || []);
      
      // Select first website by default
      if (websitesData && websitesData.length > 0) {
        setSelectedWebsite(websitesData[0]);
      }

    } catch (error: any) {
      console.error('❌ Error in fetchClientData:', error);
      setError('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
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

  if (error || !account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-24 w-24 mx-auto mb-4 text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">العميل غير موجود</h1>
          <p className="text-gray-600 mb-6">{error || 'لم يتم العثور على العميل المطلوب'}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>
              <p className="text-gray-600">مواقع العميل</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              الرئيسية
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {websites.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="h-24 w-24 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">لا توجد مواقع</h2>
            <p className="text-gray-600">لم يتم نشر أي مواقع بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* قائمة المواقع */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    المواقع المنشورة ({websites.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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
                          <h3 className="font-semibold text-sm">
                            {website.website_title || 'موقع بدون عنوان'}
                          </h3>
                          <Badge variant="default" className="text-xs">
                            نشط
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 break-all">
                          {website.website_url}
                        </p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-gray-500">
                            {new Date(website.created_at).toLocaleDateString('ar-SA')}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(website.website_url, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* معاينة الموقع */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {selectedWebsite?.website_title || 'معاينة الموقع'}
                    </CardTitle>
                    {selectedWebsite && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedWebsite.website_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        فتح في نافذة جديدة
                      </Button>
                    )}
                  </div>
                  {selectedWebsite && (
                    <p className="text-sm text-gray-600 break-all">
                      {selectedWebsite.website_url}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="h-96 lg:h-[600px]">
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
        )}
      </main>
    </div>
  );
};

export default ClientPublicPage;
