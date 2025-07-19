import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NewsItem {
  id: string;
  title: string;
  content: string | null;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
  background_color?: string;
  text_color?: string;
}

interface NewsTickerManagerProps {
  accountId: string;
}

const NewsTickerManager: React.FC<NewsTickerManagerProps> = ({ accountId }) => {
  const { t } = useLanguage();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    display_order: 0,
    background_color: '#2563eb', // اللون الأزرق الافتراضي
    text_color: '#ffffff' // اللون الأبيض الافتراضي
  });

  // دالة إعادة المحاولة
  const retryOperation = async (operation: () => Promise<any>, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        console.error(`❌ المحاولة ${attempt} فشلت:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  };

  const fetchNewsItems = async () => {
    try {
      console.log('🔍 جاري تحميل الأخبار للحساب:', accountId);
      
      const result = await retryOperation(async () => {
        const { data, error } = await supabase
          .from('news_ticker')
          .select('*')
          .eq('account_id', accountId)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('❌ خطأ في تحميل الأخبار:', error);
          throw error;
        }

        return data;
      });

      console.log('✅ تم تحميل الأخبار بنجاح:', result);
      setNewsItems(result || []);
    } catch (error: any) {
      console.error('❌ خطأ في fetchNewsItems:', error);
      toast({
        title: "خطأ في تحميل الأخبار",
        description: "تعذر تحميل الأخبار. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsItems();
  }, [accountId]);

  const resetForm = () => {
    setFormData({ 
      title: '', 
      content: '', 
      display_order: 0,
      background_color: '#2563eb',
      text_color: '#ffffff'
    });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال عنوان الخبر",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await retryOperation(async () => {
        if (editingItem) {
          // تحديث الخبر الموجود مع التحقق من وجود حقول الألوان
          console.log('📝 تحديث الخبر:', editingItem.id);
          
          // إنشاء كائن التحديث الأساسي
          const updateData: any = {
            title: formData.title.trim(),
            content: formData.content?.trim() || null,
            display_order: formData.display_order,
            updated_at: new Date().toISOString()
          };
          
          // إضافة الألوان إذا كانت موجودة
          if (formData.background_color) {
            updateData.background_color = formData.background_color;
          }
          if (formData.text_color) {
            updateData.text_color = formData.text_color;
          }
          
          const { error } = await supabase
            .from('news_ticker')
            .update(updateData)
            .eq('id', editingItem.id);

          if (error) {
            console.error('❌ خطأ في التحديث:', error);
            throw error;
          }

          toast({
            title: "تم تحديث الخبر بنجاح",
            description: `تم تحديث: ${formData.title}`
          });
        } else {
          // إضافة خبر جديد مع التحقق من وجود حقول الألوان
          console.log('➕ إضافة خبر جديد');
          
          // إنشاء كائن الإدراج الأساسي
          const insertData: any = {
            account_id: accountId,
            title: formData.title.trim(),
            content: formData.content?.trim() || null,
            display_order: formData.display_order,
            is_active: true
          };
          
          // إضافة الألوان إذا كانت موجودة
          if (formData.background_color) {
            insertData.background_color = formData.background_color;
          }
          if (formData.text_color) {
            insertData.text_color = formData.text_color;
          }
          
          const { error } = await supabase
            .from('news_ticker')
            .insert(insertData);

          if (error) {
            console.error('❌ خطأ في الإدراج:', error);
            throw error;
          }

          toast({
            title: "تم إضافة الخبر بنجاح",
            description: `تم إضافة: ${formData.title}`
          });
        }
      });

      resetForm();
      fetchNewsItems();
    } catch (error: any) {
      console.error('❌ خطأ في حفظ الخبر:', error);
      
      // رسالة خطأ مفصلة حسب نوع الخطأ
      let errorMessage = "تعذر حفظ الخبر. يرجى المحاولة مرة أخرى.";
      
      if (error.message?.includes('column') || error.code === '42703') {
        errorMessage = "هناك مشكلة في إعدادات قاعدة البيانات. سيتم حفظ الخبر بدون الألوان المخصصة.";
        
        // محاولة حفظ بدون الألوان
        try {
          if (editingItem) {
            const basicUpdateData = {
              title: formData.title.trim(),
              content: formData.content?.trim() || null,
              display_order: formData.display_order,
              updated_at: new Date().toISOString()
            };
            await supabase.from('news_ticker').update(basicUpdateData).eq('id', editingItem.id);
          } else {
            const basicInsertData = {
              account_id: accountId,
              title: formData.title.trim(),
              content: formData.content?.trim() || null,
              display_order: formData.display_order,
              is_active: true
            };
            await supabase.from('news_ticker').insert(basicInsertData);
          }
          
          toast({
            title: "تم حفظ الخبر بنجاح",
            description: "تم حفظ الخبر بالألوان الافتراضية"
          });
          
          resetForm();
          fetchNewsItems();
          return;
        } catch (retryError) {
          console.error('❌ فشل في إعادة المحاولة:', retryError);
        }
      }
      
      toast({
        title: "خطأ في حفظ الخبر",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNewsStatus = async (newsId: string, currentStatus: boolean) => {
    try {
      console.log('🔄 تغيير حالة الخبر:', { newsId, currentStatus });
      
      await retryOperation(async () => {
        const { error } = await supabase
          .from('news_ticker')
          .update({ 
            is_active: !currentStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', newsId);

        if (error) throw error;
      });

      toast({
        title: "تم تحديث حالة الخبر",
        description: !currentStatus ? 'تم تفعيل الخبر' : 'تم إيقاف الخبر'
      });

      fetchNewsItems();
    } catch (error: any) {
      console.error('❌ خطأ في تحديث حالة الخبر:', error);
      toast({
        title: "خطأ في تحديث الخبر",
        description: "تعذر تحديث حالة الخبر. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  const deleteNews = async (newsId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الخبر؟')) {
      return;
    }

    try {
      console.log('🗑️ حذف الخبر:', newsId);
      
      await retryOperation(async () => {
        const { error } = await supabase
          .from('news_ticker')
          .delete()
          .eq('id', newsId);

        if (error) throw error;
      });

      toast({
        title: "تم حذف الخبر",
        description: "تم حذف الخبر بنجاح"
      });

      fetchNewsItems();
    } catch (error: any) {
      console.error('❌ خطأ في حذف الخبر:', error);
      toast({
        title: "خطأ في حذف الخبر",
        description: "تعذر حذف الخبر. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  const startEdit = (item: NewsItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content || '',
      display_order: item.display_order || 0,
      background_color: item.background_color || '#2563eb',
      text_color: item.text_color || '#ffffff'
    });
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('news_ticker_management')} ({newsItems.length})</CardTitle>
            <Button 
              onClick={() => setShowAddForm(true)} 
              size="sm"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('add_news')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">لا توجد أخبار بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {newsItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.content && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {item.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        ترتيب العرض: {item.display_order} | تم الإنشاء: {new Date(item.created_at).toLocaleDateString('ar-SA')}
                      </p>
                      {/* معاينة الألوان */}
                      {(item.background_color || item.text_color) && (
                        <div className="mt-2">
                          <div 
                            className="inline-block px-3 py-1 rounded text-xs"
                            style={{
                              backgroundColor: item.background_color || '#2563eb',
                              color: item.text_color || '#ffffff'
                            }}
                          >
                            معاينة الألوان
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? 'نشط' : 'متوقف'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleNewsStatus(item.id, item.is_active)}
                        disabled={loading}
                      >
                        {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(item)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNews(item.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddForm && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold mb-4">
                {editingItem ? 'تحرير الخبر' : 'إضافة خبر جديد'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان الخبر</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="اكتب عنوان الخبر"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="content">محتوى الخبر (اختياري)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="اكتب تفاصيل الخبر"
                    rows={3}
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="background_color">لون خلفية الشريط</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="background_color"
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                        disabled={loading}
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        placeholder="#2563eb"
                        className="flex-1"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="text_color">لون النص</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="text_color"
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                        disabled={loading}
                      />
                      <Input
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        placeholder="#ffffff"
                        className="flex-1"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="display_order">ترتيب العرض</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    disabled={loading}
                  />
                </div>
                {/* معاينة الألوان */}
                <div>
                  <Label>معاينة الشريط</Label>
                  <div 
                    className="p-4 rounded-lg text-center font-medium"
                    style={{
                      backgroundColor: formData.background_color,
                      color: formData.text_color
                    }}
                  >
                    <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold ml-2">أخبار</span>
                    {formData.title || 'عنوان الخبر سيظهر هنا'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'جاري الحفظ...' : (editingItem ? 'تحديث' : 'إضافة')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    disabled={loading}
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
  );
};

export default NewsTickerManager;