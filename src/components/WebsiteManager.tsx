
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Globe, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Website {
  id: string;
  website_title: string;
  website_url: string;
  is_active: boolean;
  created_at: string;
  account_id: string;
}

interface WebsiteManagerProps {
  accountId: string;
  branchId?: string | null;
}

const WebsiteManager: React.FC<WebsiteManagerProps> = ({ accountId, branchId }) => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [newWebsiteTitle, setNewWebsiteTitle] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWebsites();
  }, [accountId]);

  const loadWebsites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('account_websites')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebsites(data || []);
    } catch (error: any) {
      console.error('Error loading websites:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المواقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async () => {
    if (!newWebsiteTitle.trim() || !newWebsiteUrl.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('account_websites')
        .insert({
          account_id: accountId,
          website_title: newWebsiteTitle.trim(),
          website_url: newWebsiteUrl.trim(),
          is_active: true,
        });

      if (error) throw error;

      // Store branch assignment in localStorage if branch is selected
      if (branchId) {
        localStorage.setItem(`website_branch_new`, branchId);
      }

      setNewWebsiteTitle('');
      setNewWebsiteUrl('');
      setIsAddDialogOpen(false);
      
      toast({
        title: "نجح",
        description: "تم إضافة الموقع بنجاح",
      });
      
      loadWebsites();
    } catch (error: any) {
      console.error('Error adding website:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الموقع",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWebsite = async () => {
    if (!editingWebsite || !newWebsiteTitle.trim() || !newWebsiteUrl.trim()) return;

    try {
      const { error } = await supabase
        .from('account_websites')
        .update({
          website_title: newWebsiteTitle.trim(),
          website_url: newWebsiteUrl.trim(),
        })
        .eq('id', editingWebsite.id);

      if (error) throw error;

      setEditingWebsite(null);
      setNewWebsiteTitle('');
      setNewWebsiteUrl('');
      
      toast({
        title: "نجح",
        description: "تم تحديث الموقع بنجاح",
      });
      
      loadWebsites();
    } catch (error: any) {
      console.error('Error updating website:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الموقع",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    try {
      const { error } = await supabase
        .from('account_websites')
        .delete()
        .eq('id', websiteId);

      if (error) throw error;

      // Remove branch assignment from localStorage
      localStorage.removeItem(`website_branch_${websiteId}`);

      toast({
        title: "نجح",
        description: "تم حذف الموقع بنجاح",
      });
      
      loadWebsites();
    } catch (error: any) {
      console.error('Error deleting website:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الموقع",
        variant: "destructive",
      });
    }
  };

  const toggleWebsiteStatus = async (websiteId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('account_websites')
        .update({ is_active: !currentStatus })
        .eq('id', websiteId);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم تحديث حالة الموقع بنجاح",
      });
      
      loadWebsites();
    } catch (error: any) {
      console.error('Error updating website status:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة الموقع",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-4 text-center">جاري التحميل...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          إدارة المواقع
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              إضافة موقع
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة موقع جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">عنوان الموقع</label>
                <Input
                  value={newWebsiteTitle}
                  onChange={(e) => setNewWebsiteTitle(e.target.value)}
                  placeholder="أدخل عنوان الموقع"
                />
              </div>
              <div>
                <label className="text-sm font-medium">رابط الموقع</label>
                <Input
                  value={newWebsiteUrl}
                  onChange={(e) => setNewWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <Button onClick={handleAddWebsite} className="w-full">
                إضافة الموقع
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {websites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد مواقع مضافة
            </div>
          ) : (
            websites.map((website) => (
              <Card key={website.id} className={!website.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{website.website_title}</h3>
                          <Badge variant={website.is_active ? 'default' : 'secondary'}>
                            {website.is_active ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground break-all">
                          {website.website_url}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(website.website_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleWebsiteStatus(website.id, website.is_active)}
                      >
                        {website.is_active ? 'تعطيل' : 'تفعيل'}
                      </Button>
                      
                      <Dialog open={editingWebsite?.id === website.id} onOpenChange={(open) => {
                        if (!open) {
                          setEditingWebsite(null);
                          setNewWebsiteTitle('');
                          setNewWebsiteUrl('');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingWebsite(website);
                              setNewWebsiteTitle(website.website_title);
                              setNewWebsiteUrl(website.website_url);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تعديل الموقع</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">عنوان الموقع</label>
                              <Input
                                value={newWebsiteTitle}
                                onChange={(e) => setNewWebsiteTitle(e.target.value)}
                                placeholder="أدخل عنوان الموقع"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">رابط الموقع</label>
                              <Input
                                value={newWebsiteUrl}
                                onChange={(e) => setNewWebsiteUrl(e.target.value)}
                                placeholder="https://example.com"
                              />
                            </div>
                            <Button onClick={handleUpdateWebsite} className="w-full">
                              تحديث الموقع
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الموقع</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من أنك تريد حذف هذا الموقع؟ هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteWebsite(website.id)}>
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WebsiteManager;
