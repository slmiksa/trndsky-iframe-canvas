
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Images, Eye, EyeOff, Trash2, Upload, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Slideshow {
  id: string;
  title: string;
  images: string[];
  interval_seconds: number;
  is_active: boolean;
  created_at: string;
}

interface SlideshowManagerProps {
  accountId: string;
}

const SlideshowManager: React.FC<SlideshowManagerProps> = ({ accountId }) => {
  const { t } = useLanguage();
  const { userRole } = useAuth();
  const [slideshows, setSlideshows] = useState<Slideshow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSlideshow, setSelectedSlideshow] = useState<Slideshow | null>(null);
  const [newSlideshow, setNewSlideshow] = useState({
    title: '',
    interval_seconds: 5,
    images: [] as File[]
  });
  const [uploading, setUploading] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(30);
  const [savingInterval, setSavingInterval] = useState(false);

  // جلب إعدادات الحساب وفترة التنقل
  const fetchAccountSettings = async () => {
    try {
      console.log('🔍 Fetching account settings for:', accountId);
      
      const { data, error } = await supabase
        .from('accounts')
        .select('rotation_interval')
        .eq('id', accountId)
        .single();

      if (error) {
        console.error('❌ Error fetching account settings:', error);
        return;
      }

      if (data) {
        console.log('✅ Account settings fetched:', data);
        setRotationInterval(data.rotation_interval || 30);
      }
    } catch (error) {
      console.error('❌ Exception in fetchAccountSettings:', error);
    }
  };

  const fetchSlideshows = async () => {
    try {
      console.log('🔍 Fetching slideshows for account:', accountId);
      
      // استخدام الدالة الآمنة الجديدة للحصول على جميع السلايدات
      const { data, error } = await supabase.rpc('get_all_slideshows_for_account', {
        p_account_id: accountId
      });

      if (error) {
        console.error('❌ Error fetching slideshows:', error);
        toast({
          title: 'خطأ في تحميل السلايدات',
          description: `خطأ: ${error.message}`,
          variant: "destructive"
        });
        setSlideshows([]);
        return;
      }

      console.log('✅ Slideshows fetched successfully:', data);
      setSlideshows(data || []);
    } catch (error) {
      console.error('❌ Exception in fetchSlideshows:', error);
      toast({
        title: 'خطأ في تحميل السلايدات',
        description: 'حدث خطأ غير متوقع',
        variant: "destructive"
      });
      setSlideshows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      console.log('🚀 SlideshowManager mounted for account:', accountId);
      fetchAccountSettings();
      fetchSlideshows();
    }
    
    // إعداد مستمع للتحديثات المباشرة
    const channel = supabase
      .channel(`slideshows-${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_slideshows',
          filter: `account_id=eq.${accountId}`
        },
        async (payload) => {
          console.log('🎬 Slideshow change detected:', payload);
          await fetchSlideshows();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'accounts',
          filter: `id=eq.${accountId}`
        },
        async (payload) => {
          console.log('📡 Account settings change detected');
          await fetchAccountSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${accountId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        console.log('📤 Uploading file to slideshow-images bucket:', fileName);
        
        const { data, error } = await supabase.storage
          .from('slideshow-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('❌ Error uploading file:', error);
          throw new Error(`فشل رفع الملف ${file.name}: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('slideshow-images')
          .getPublicUrl(fileName);

        console.log('✅ File uploaded successfully:', publicUrl);
        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('❌ Error in uploadImages:', error);
        throw error;
      }
    }

    return uploadedUrls;
  };

  const addSlideshow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSlideshow.images.length === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار صور للسلايدات',
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      console.log('📤 Starting slideshow creation process for account:', accountId);
      
      // رفع الصور أولاً
      const imageUrls = await uploadImages(newSlideshow.images);
      console.log('✅ Images uploaded successfully:', imageUrls);
      
      // استخدام الدالة الآمنة الجديدة لإنشاء السلايدات
      const { data, error } = await supabase.rpc('create_slideshow_bypass_rls', {
        p_account_id: accountId,
        p_title: newSlideshow.title,
        p_images: imageUrls,
        p_interval_seconds: newSlideshow.interval_seconds
      });

      if (error) {
        console.error('❌ Error creating slideshow:', error);
        throw new Error(`فشل في إنشاء السلايدات: ${error.message}`);
      }

      console.log('✅ Slideshow created successfully with ID:', data);

      toast({
        title: 'تم إضافة السلايدات بنجاح',
        description: newSlideshow.title
      });

      setNewSlideshow({ title: '', interval_seconds: 5, images: [] });
      setShowAddForm(false);
      
      await fetchSlideshows();
      
    } catch (error: any) {
      console.error('❌ Error in addSlideshow:', error);
      toast({
        title: 'خطأ في إضافة السلايدات',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleSlideshowStatus = async (slideshowId: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Toggling slideshow status:', { slideshowId, currentStatus });

      // تحديث حالة السلايد شو مباشرة
      const { error } = await supabase
        .from('account_slideshows')
        .update({ is_active: !currentStatus })
        .eq('id', slideshowId)
        .eq('account_id', accountId); // التأكد من أن السلايد شو ينتمي للحساب

      if (error) {
        console.error('❌ Error updating slideshow status:', error);
        throw error;
      }

      const statusMessage = !currentStatus ? 'تم تشغيل السلايد شو' : 'تم إيقاف السلايد شو';
      toast({
        title: 'تم تحديث حالة السلايد شو',
        description: statusMessage
      });

      // تحديث القائمة المحلية فوراً
      setSlideshows(prevSlideshows => 
        prevSlideshows.map(slide => 
          slide.id === slideshowId 
            ? { ...slide, is_active: !currentStatus }
            : slide
        )
      );

      console.log('✅ Slideshow status updated successfully');
      
    } catch (error: any) {
      console.error('❌ Error in toggleSlideshowStatus:', error);
      toast({
        title: 'خطأ في تحديث السلايد شو',
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateRotationInterval = async () => {
    if (rotationInterval < 5 || rotationInterval > 300) {
      toast({
        title: 'خطأ في القيمة',
        description: 'يجب أن تكون فترة التنقل بين 5 و 300 ثانية',
        variant: "destructive"
      });
      return;
    }

    setSavingInterval(true);
    try {
      console.log('🔄 Updating rotation interval to:', rotationInterval);
      
      const { error } = await supabase
        .from('accounts')
        .update({ rotation_interval: rotationInterval })
        .eq('id', accountId);

      if (error) {
        console.error('❌ Error updating rotation interval:', error);
        throw error;
      }

      toast({
        title: 'تم تحديث فترة التنقل',
        description: `تم تعديل فترة التنقل إلى ${rotationInterval} ثانية`
      });
    } catch (error: any) {
      console.error('❌ Error in updateRotationInterval:', error);
      toast({
        title: 'خطأ في تحديث فترة التنقل',
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingInterval(false);
    }
  };

  const deleteSlideshow = async (slideshowId: string) => {
    try {
      console.log('🗑️ Deleting slideshow:', slideshowId);
      
      const slideshow = slideshows.find(s => s.id === slideshowId);
      if (slideshow && slideshow.images) {
        // حذف الصور من التخزين
        for (const imageUrl of slideshow.images) {
          try {
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const folderName = urlParts[urlParts.length - 2];
            const filePath = `${folderName}/${fileName}`;
            
            await supabase.storage
              .from('slideshow-images')
              .remove([filePath]);
          } catch (storageError) {
            console.warn('⚠️ Could not delete image from storage:', storageError);
          }
        }
      }

      const { error } = await supabase
        .from('account_slideshows')
        .delete()
        .eq('id', slideshowId)
        .eq('account_id', accountId); // التأكد من أن السلايد شو ينتمي للحساب

      if (error) {
        console.error('❌ Error deleting slideshow:', error);
        throw error;
      }

      console.log('✅ Slideshow deleted successfully');
      toast({
        title: 'تم حذف السلايدات',
        description: 'تم حذف السلايدات بنجاح'
      });

      setSelectedSlideshow(null);
      await fetchSlideshows();
    } catch (error: any) {
      console.error('❌ Error in deleteSlideshow:', error);
      toast({
        title: 'خطأ في حذف السلايدات',
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewSlideshow(prev => ({ ...prev, images: files }));
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setLoading(true);
    await fetchSlideshows();
  };

  const activeSlideshowsCount = slideshows.filter(s => s.is_active).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* قائمة السلايد شوز */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                السلايد شوز ({slideshows.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} size="sm" variant="outline" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
                <Button onClick={() => setShowAddForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة سلايد شو
                </Button>
              </div>
            </div>
            
            {/* إعدادات فترة التنقل */}
            <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotationInterval" className="text-sm font-medium">
                  فترة التنقل بين السلايد شوز (ثانية)
                </Label>
                <Badge variant="outline">
                  {activeSlideshowsCount} نشط
                </Badge>
              </div>
              <div className="flex gap-2">
                <Input 
                  id="rotationInterval"
                  type="number" 
                  min="5"
                  max="300"
                  value={rotationInterval} 
                  onChange={(e) => setRotationInterval(parseInt(e.target.value) || 30)}
                  className="w-20"
                />
                <Button 
                  onClick={updateRotationInterval} 
                  size="sm" 
                  variant="outline"
                  disabled={savingInterval}
                >
                  {savingInterval ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                النظام ينتقل تلقائياً بين السلايد شوز النشطة كل {rotationInterval} ثانية
              </p>
            </div>

            <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
              <p className="font-medium">النظام الحالي:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• يمكن تنشيط أي عدد من السلايد شوز في نفس الوقت</li>
                <li>• التنقل التلقائي بين السلايد شوز النشطة حسب الفترة المحددة</li>
                <li>• كل سلايد شو يعرض صوره الخاصة بالسرعة المحددة له</li>
                <li>• استخدم زر العين لتفعيل/إلغاء تفعيل أي سلايد شو</li>
              </ul>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">جاري التحميل...</p>
              </div>
            ) : slideshows.length === 0 ? (
              <div className="text-center py-8">
                <Images className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">لا توجد سلايد شوز حتى الآن</p>
                <p className="text-sm text-gray-500 mt-2">Account ID: {accountId}</p>
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  تحديث
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {slideshows.map(slideshow => (
                  <div 
                    key={slideshow.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedSlideshow?.id === slideshow.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`} 
                    onClick={() => setSelectedSlideshow(slideshow)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{slideshow.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={slideshow.is_active ? "default" : "secondary"}>
                          {slideshow.is_active ? 'نشط' : 'متوقف'}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSlideshowStatus(slideshow.id, slideshow.is_active);
                          }}
                          title={slideshow.is_active ? 'إيقاف السلايد شو' : 'تشغيل السلايد شو'}
                        >
                          {slideshow.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSlideshow(slideshow.id);
                          }}
                          title="حذف السلايد شو"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{slideshow.images.length} صورة</span>
                      <span>{slideshow.interval_seconds} ثانية لكل صورة</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(slideshow.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* نموذج إضافة سلايد شو */}
            {showAddForm && (
              <div className="mt-6 border-t pt-6">
                <form onSubmit={addSlideshow} className="space-y-4">
                  <div>
                    <Label htmlFor="title">عنوان السلايد شو</Label>
                    <Input 
                      id="title" 
                      type="text" 
                      value={newSlideshow.title} 
                      onChange={(e) => setNewSlideshow({ ...newSlideshow, title: e.target.value })} 
                      placeholder="اسم السلايد شو" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="interval">المدة بين الصور (ثانية)</Label>
                    <Input 
                      id="interval" 
                      type="number" 
                      min="1"
                      max="60"
                      value={newSlideshow.interval_seconds} 
                      onChange={(e) => setNewSlideshow({ ...newSlideshow, interval_seconds: parseInt(e.target.value) || 5 })} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="images">رفع الصور</Label>
                    <Input 
                      id="images" 
                      type="file" 
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      required 
                    />
                    {newSlideshow.images.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        تم اختيار {newSlideshow.images.length} صورة
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={uploading}>
                      {uploading ? <Upload className="h-4 w-4 mr-2 animate-spin" /> : null}
                      {uploading ? 'جاري الرفع...' : 'إضافة'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false);
                        setNewSlideshow({ title: '', interval_seconds: 5, images: [] });
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

      {/* معاينة السلايد شو */}
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>
              {selectedSlideshow ? selectedSlideshow.title : 'معاينة السلايد شو'}
            </CardTitle>
            {selectedSlideshow && (
              <p className="text-sm text-gray-600">
                {selectedSlideshow.images.length} صورة - {selectedSlideshow.interval_seconds} ثانية
              </p>
            )}
          </CardHeader>
          <CardContent className="h-96 lg:h-[500px]">
            {selectedSlideshow ? (
              <SlideshowPreview slideshow={selectedSlideshow} />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                <div className="text-center text-gray-500">
                  <Images className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>اختر سلايد شو للمعاينة</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// مكون معاينة السلايدات
const SlideshowPreview: React.FC<{ slideshow: Slideshow }> = ({ slideshow }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (slideshow.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshow.images.length);
    }, slideshow.interval_seconds * 1000);

    return () => clearInterval(interval);
  }, [slideshow.images.length, slideshow.interval_seconds]);

  if (slideshow.images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <p className="text-gray-500">لا توجد صور</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden bg-black">
      <img 
        src={slideshow.images[currentImageIndex]} 
        alt={`Slide ${currentImageIndex + 1}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {slideshow.images.map((_, index) => (
          <div 
            key={index} 
            className={`w-2 h-2 rounded-full ${
              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
            }`} 
          />
        ))}
      </div>
    </div>
  );
};

export default SlideshowManager;
