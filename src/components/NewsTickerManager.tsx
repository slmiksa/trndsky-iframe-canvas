
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Newspaper } from 'lucide-react';

interface NewsTicker {
  id: string;
  account_id: string;
  title: string;
  content: string | null;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

interface NewsTickerManagerProps {
  accountId: string;
  branchId?: string | null;
}

const NewsTickerManager: React.FC<NewsTickerManagerProps> = ({ accountId, branchId }) => {
  const [newsTickers, setNewsTickers] = useState<NewsTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTickerTitle, setNewTickerTitle] = useState('');
  const [newTickerContent, setNewTickerContent] = useState('');
  const [editingTicker, setEditingTicker] = useState<NewsTicker | null>(null);

  useEffect(() => {
    fetchNewsTickers();
  }, [accountId, branchId]);

  const fetchNewsTickers = async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      console.log('🔍 Fetching news tickers for account:', accountId, 'branchId:', branchId);

      const { data, error } = await supabase
        .from('news_ticker')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching news tickers:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل شريط الأخبار",
          variant: "destructive",
        });
      } else {
        console.log('✅ News tickers fetched:', data);
        setNewsTickers(data || []);
      }
    } catch (error) {
      console.error('❌ Error in fetchNewsTickers:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل شريط الأخبار",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNewsTicker = async () => {
    if (!accountId) {
      toast({
        title: "خطأ",
        description: "معرف الحساب غير موجود",
        variant: "destructive",
      });
      return;
    }

    if (!newTickerTitle.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان شريط الأخبار",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('➕ Adding new news ticker:', {
        accountId,
        title: newTickerTitle,
        content: newTickerContent,
      });

      const { data, error } = await supabase
        .from('news_ticker')
        .insert([{
          account_id: accountId,
          title: newTickerTitle,
          content: newTickerContent || null,
          is_active: true,
        }])
        .select();

      if (error) {
        console.error('❌ Error adding news ticker:', error);
        toast({
          title: "خطأ",
          description: "فشل في إضافة شريط الأخبار",
          variant: "destructive",
        });
      } else {
        console.log('✅ News ticker added successfully:', data);
        toast({
          title: "نجح",
          description: "تم إضافة شريط الأخبار بنجاح",
        });
        setNewTickerTitle('');
        setNewTickerContent('');
        setShowAddForm(false);
        fetchNewsTickers();
      }
    } catch (error) {
      console.error('❌ Error in addNewsTicker:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة شريط الأخبار",
        variant: "destructive",
      });
    }
  };

  const updateNewsTicker = async (id: string, title: string, content: string) => {
    try {
      console.log('🔄 Updating news ticker:', { id, title, content });

      const { data, error } = await supabase
        .from('news_ticker')
        .update({ 
          title: title,
          content: content || null
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Error updating news ticker:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحديث شريط الأخبار",
          variant: "destructive",
        });
      } else {
        console.log('✅ News ticker updated successfully:', data);
        toast({
          title: "نجح",
          description: "تم تحديث شريط الأخبار بنجاح",
        });
        setEditingTicker(null);
        setNewTickerTitle('');
        setNewTickerContent('');
        fetchNewsTickers();
      }
    } catch (error) {
      console.error('❌ Error in updateNewsTicker:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث شريط الأخبار",
        variant: "destructive",
      });
    }
  };

  const toggleNewsTickerStatus = async (id: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Toggling news ticker status:', { id, currentStatus });

      const { data, error } = await supabase
        .from('news_ticker')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Error updating news ticker status:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحديث حالة شريط الأخبار",
          variant: "destructive",
        });
      } else {
        console.log('✅ News ticker status updated successfully:', data);
        toast({
          title: "نجح",
          description: `تم ${currentStatus ? 'إلغاء تفعيل' : 'تفعيل'} شريط الأخبار`,
        });
        fetchNewsTickers();
      }
    } catch (error) {
      console.error('❌ Error in toggleNewsTickerStatus:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة شريط الأخبار",
        variant: "destructive",
      });
    }
  };

  const deleteNewsTicker = async (id: string) => {
    try {
      console.log('🗑️ Deleting news ticker:', id);

      const { data, error } = await supabase
        .from('news_ticker')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Error deleting news ticker:', error);
        toast({
          title: "خطأ",
          description: "فشل في حذف شريط الأخبار",
          variant: "destructive",
        });
      } else {
        console.log('✅ News ticker deleted successfully:', data);
        toast({
          title: "نجح",
          description: "تم حذف شريط الأخبار بنجاح",
        });
        fetchNewsTickers();
      }
    } catch (error) {
      console.error('❌ Error in deleteNewsTicker:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف شريط الأخبار",
        variant: "destructive",
      });
    }
  };

  // Initialize edit form when editing ticker changes
  useEffect(() => {
    if (editingTicker) {
      setNewTickerTitle(editingTicker.title);
      setNewTickerContent(editingTicker.content || '');
    }
  }, [editingTicker]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            إدارة شريط الأخبار ({newsTickers.length})
          </CardTitle>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                إضافة شريط أخبار
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة شريط أخبار جديد</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addNewsTicker();
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="title">العنوان</Label>
                  <Input
                    id="title"
                    value={newTickerTitle}
                    onChange={(e) => setNewTickerTitle(e.target.value)}
                    placeholder="أدخل عنوان شريط الأخبار"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">المحتوى</Label>
                  <Input
                    id="content"
                    value={newTickerContent}
                    onChange={(e) => setNewTickerContent(e.target.value)}
                    placeholder="أدخل محتوى شريط الأخبار"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">إضافة</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTickerTitle('');
                      setNewTickerContent('');
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {newsTickers.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا يوجد أشرطة أخبار حتى الآن</p>
            <p className="text-sm text-gray-500">ابدأ بإنشاء شريط أخبار جديد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {newsTickers.map((ticker) => (
              <div
                key={ticker.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Newspaper className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{ticker.title}</p>
                      {ticker.content && (
                        <p className="text-sm text-gray-600 mt-1">{ticker.content}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ticker.is_active ? "default" : "secondary"}>
                      {ticker.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleNewsTickerStatus(ticker.id, ticker.is_active)}
                    >
                      {ticker.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                    </Button>
                    <Dialog 
                      open={editingTicker?.id === ticker.id} 
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingTicker(null);
                          setNewTickerTitle('');
                          setNewTickerContent('');
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTicker(ticker)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>تعديل شريط الأخبار</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (editingTicker) {
                              updateNewsTicker(editingTicker.id, newTickerTitle, newTickerContent);
                            }
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="edit-title">العنوان</Label>
                            <Input
                              id="edit-title"
                              value={newTickerTitle}
                              onChange={(e) => setNewTickerTitle(e.target.value)}
                              placeholder="أدخل عنوان شريط الأخبار"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-content">المحتوى</Label>
                            <Input
                              id="edit-content"
                              value={newTickerContent}
                              onChange={(e) => setNewTickerContent(e.target.value)}
                              placeholder="أدخل محتوى شريط الأخبار"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit">تحديث</Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingTicker(null);
                                setNewTickerTitle('');
                                setNewTickerContent('');
                              }}
                            >
                              إلغاء
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNewsTicker(ticker.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  تم الإنشاء في: {new Date(ticker.created_at).toLocaleDateString('ar-SA')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsTickerManager;
