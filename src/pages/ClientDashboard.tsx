
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import NotificationManager from '@/components/NotificationManager';
import SlideshowManager from '@/components/SlideshowManager';
import NewsTickerManager from '@/components/NewsTickerManager';
import BreakTimerManager from '@/components/BreakTimerManager';
import ClientBranchView from '@/components/ClientBranchView';
import { 
  Settings, 
  Image as ImageIcon, 
  Megaphone, 
  Clock, 
  Calendar,
  Building2,
  Globe,
  Users
} from 'lucide-react';

const ClientDashboard = () => {
  const { user, signOut, accountId } = useAuth();
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSelectBranch = (branchId: string, branchName: string) => {
    setSelectedBranch(branchId);
    setSelectedBranchName(branchName);
  };

  if (!user || !accountId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم العميل</h1>
              {selectedBranch && (
                <p className="text-sm text-gray-600 mt-1">
                  الفرع المحدد: <Badge variant="outline">{selectedBranchName}</Badge>
                </p>
              )}
            </div>
            <Button onClick={signOut} variant="outline">
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <Tabs defaultValue="branches" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="branches" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              الفروع
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإشعارات
            </TabsTrigger>
            <TabsTrigger value="slideshow" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              عرض الشرائح
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              الأخبار
            </TabsTrigger>
            <TabsTrigger value="timers" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              المؤقتات
            </TabsTrigger>
            <TabsTrigger value="public" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              الصفحة العامة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branches" className="mt-6">
            <ClientBranchView 
              accountId={accountId}
              onSelectBranch={handleSelectBranch}
              selectedBranch={selectedBranch}
            />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            {selectedBranch ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      إدارة الإشعارات - {selectedBranchName}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <NotificationManager accountId={accountId} branchId={selectedBranch} />
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">يرجى اختيار فرع أولاً من تبويب الفروع</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="slideshow" className="mt-6">
            {selectedBranch ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      إدارة عرض الشرائح - {selectedBranchName}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <SlideshowManager accountId={accountId} branchId={selectedBranch} />
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">يرجى اختيار فرع أولاً من تبويب الفروع</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="news" className="mt-6">
            {selectedBranch ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      إدارة شريط الأخبار - {selectedBranchName}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <NewsTickerManager accountId={accountId} branchId={selectedBranch} />
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">يرجى اختيار فرع أولاً من تبويب الفروع</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timers" className="mt-6">
            {selectedBranch ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      إدارة المؤقتات - {selectedBranchName}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <BreakTimerManager accountId={accountId} branchId={selectedBranch} />
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">يرجى اختيار فرع أولاً من تبويب الفروع</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="public" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  رابط الصفحة العامة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800 font-medium mb-2">رابط الصفحة العامة للحساب:</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-3 py-2 rounded border text-sm flex-1" dir="ltr">
                        {window.location.origin}/client/{accountId}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/client/${accountId}`);
                        }}
                      >
                        نسخ
                      </Button>
                    </div>
                  </div>
                  
                  {selectedBranch && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-800 font-medium mb-2">رابط الصفحة العامة للفرع ({selectedBranchName}):</p>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-3 py-2 rounded border text-sm flex-1" dir="ltr">
                          {window.location.origin}/client/{accountId}?branch={selectedBranch}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/client/${accountId}?branch=${selectedBranch}`);
                            
                          }}
                        >
                          نسخ
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    <p>• يمكن مشاركة هذه الروابط مع العملاء لعرض المحتوى الخاص بك</p>
                    <p>• رابط الحساب يعرض محتوى جميع الفروع</p>
                    <p>• رابط الفرع يعرض محتوى الفرع المحدد فقط</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClientDashboard;
