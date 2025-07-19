import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Images, Eye, EyeOff, Trash2, Upload, RefreshCw, Video, Play, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Slideshow {
  id: string;
  title: string;
  images: string[];
  video_urls?: string[];
  media_type?: 'images' | 'videos' | 'mixed';
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
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSlideshow, setEditingSlideshow] = useState<Slideshow | null>(null);
  const [selectedSlideshow, setSelectedSlideshow] = useState<Slideshow | null>(null);
  const [newSlideshow, setNewSlideshow] = useState({
    title: '',
    images: [] as File[],
    videos: [] as File[],
    mediaType: 'images' as 'images' | 'videos' | 'mixed'
  });
  const [editSlideshow, setEditSlideshow] = useState({
    title: '',
    images: [] as File[],
    videos: [] as File[],
    mediaType: 'images' as 'images' | 'videos' | 'mixed',
    keepExistingMedia: true
  });
  const [uploading, setUploading] = useState(false);

  // دالة للتحقق من مدة الفيديو
  const validateVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        // التحقق من أن المدة أقل من 3 دقائق (180 ثانية)
        resolve(video.duration <= 180);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(false);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const fetchSlideshows = async () => {
    try {
      console.log('🔍 Fetching slideshows for account:', accountId);
      
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
      setSlideshows(data?.map(item => ({
        ...item,
        video_urls: (item as any).video_urls || [],
        media_type: (item as any).media_type || 'images'
      })) || []);
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
      fetchSlideshows();
    }
    
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  const uploadMedia = async (files: File[], mediaType: 'images' | 'videos'): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      try {
        // التحقق من مدة الفيديو إذا كان فيديو
        if (mediaType === 'videos') {
          const isValidDuration = await validateVideoDuration(file);
          if (!isValidDuration) {
            throw new Error(`الفيديو ${file.name} يجب أن يكون أقل من 3 دقائق`);
          }
        }

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
        console.error('❌ Error in uploadMedia:', error);
        throw error;
      }
    }

    return uploadedUrls;
  };

  const addSlideshow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSlideshow.images.length === 0 && newSlideshow.videos.length === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار صور أو فيديوهات للسلايدات',
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      console.log('📤 Starting slideshow creation process for account:', accountId);
      
      // رفع الصور والفيديوهات
      const imageUrls = newSlideshow.images.length > 0 ? await uploadMedia(newSlideshow.images, 'images') : [];
      const videoUrls = newSlideshow.videos.length > 0 ? await uploadMedia(newSlideshow.videos, 'videos') : [];
      
      console.log('✅ Media uploaded successfully:', { imageUrls, videoUrls });
      
      // إنشاء السلايدشو
      const { data, error } = await supabase.rpc('create_slideshow_bypass_rls', {
        p_account_id: accountId,
        p_title: newSlideshow.title,
        p_images: imageUrls,
        p_video_urls: videoUrls,
        p_media_type: newSlideshow.mediaType,
        p_interval_seconds: 15
      } as any);

      if (error) {
        console.error('❌ Error creating slideshow:', error);
        throw new Error(`فشل في إنشاء السلايدات: ${error.message}`);
      }

      console.log('✅ Slideshow created successfully with ID:', data);

      toast({
        title: 'تم إضافة السلايدات بنجاح',
        description: newSlideshow.title
      });

      setNewSlideshow({ title: '', images: [], videos: [], mediaType: 'images' });
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
    const newStatus = !currentStatus;

    setSlideshows(prevSlideshows =>
      prevSlideshows.map(slide => {
        if (newStatus) {
          return { ...slide, is_active: slide.id === slideshowId };
        } else {
          return slide.id === slideshowId ? { ...slide, is_active: false } : slide;
        }
      })
    );

    try {
      if (newStatus) {
        console.log(`🔵 Deactivating all slideshows for account ${accountId}...`);
        const { error: deactivateError } = await supabase
          .from('account_slideshows')
          .update({ is_active: false })
          .eq('account_id', accountId);

        if (deactivateError) {
          console.error('❌ Error deactivating slideshows:', deactivateError);
          throw new Error(`فشل في إيقاف السلايدات الحالية: ${deactivateError.message}`);
        }

        console.log(`🔵 Activating slideshow ${slideshowId}...`);
        const { error: activateError } = await supabase
          .from('account_slideshows')
          .update({ is_active: true })
          .eq('id', slideshowId);

        if (activateError) {
          console.error('❌ Error activating slideshow:', activateError);
          throw new Error(`فشل في تشغيل السلايد شو المحدد: ${activateError.message}`);
        }

        toast({
          title: 'تم تشغيل السلايد شو بنجاح',
        });

      } else {
        console.log(`🔵 Deactivating slideshow ${slideshowId}...`);
        const { error } = await supabase
          .from('account_slideshows')
          .update({ is_active: false })
          .eq('id', slideshowId);

        if (error) {
          console.error('❌ Error deactivating slideshow:', error);
          throw new Error(`فشل في إيقاف السلايد شو: ${error.message}`);
        }

        toast({
          title: 'تم إيقاف السلايد شو',
        });
      }

      await fetchSlideshows();

    } catch (error: any) {
      console.error('❌ Error in toggleSlideshowStatus:', error);
      toast({
        title: 'خطأ في تحديث السلايد شو',
        description: error.message,
        variant: "destructive"
      });
      await fetchSlideshows();
    }
  };

  const deleteSlideshow = async (slideshowId: string) => {
    try {
      console.log('🗑️ Deleting slideshow:', slideshowId);
      
      const slideshow = slideshows.find(s => s.id === slideshowId);
      if (slideshow) {
        // حذف الصور
        if (slideshow.images) {
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
        
        // حذف الفيديوهات
        if (slideshow.video_urls) {
          for (const videoUrl of slideshow.video_urls) {
            try {
              const urlParts = videoUrl.split('/');
              const fileName = urlParts[urlParts.length - 1];
              const folderName = urlParts[urlParts.length - 2];
              const filePath = `${folderName}/${fileName}`;
              
              await supabase.storage
                .from('slideshow-images')
                .remove([filePath]);
            } catch (storageError) {
              console.warn('⚠️ Could not delete video from storage:', storageError);
            }
          }
        }
      }

      const { error } = await supabase
        .from('account_slideshows')
        .delete()
        .eq('id', slideshowId)
        .eq('account_id', accountId);

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

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewSlideshow(prev => ({ ...prev, videos: files }));
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setLoading(true);
    await fetchSlideshows();
  };

  const getTotalMediaCount = (slideshow: Slideshow) => {
    return (slideshow.images?.length || 0) + (slideshow.video_urls?.length || 0);
  };

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'videos':
        return <Video className="h-4 w-4" />;
      case 'mixed':
        return <Play className="h-4 w-4" />;
      default:
        return <Images className="h-4 w-4" />;
    }
  };

  // دالة فتح نموذج التعديل
  const handleEditSlideshow = (slideshow: Slideshow) => {
    setEditingSlideshow(slideshow);
    setEditSlideshow({
      title: slideshow.title,
      images: [],
      videos: [],
      mediaType: slideshow.media_type || 'images',
      keepExistingMedia: true
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  // دالة تعديل السلايدشو
  const updateSlideshow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlideshow) return;

    if (editSlideshow.images.length === 0 && editSlideshow.videos.length === 0 && !editSlideshow.keepExistingMedia) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار صور أو فيديوهات أو الاحتفاظ بالموجود',
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      console.log('🔄 Starting slideshow update process for:', editingSlideshow.id);
      
      // رفع الملفات الجديدة إذا وجدت
      const newImageUrls = editSlideshow.images.length > 0 ? await uploadMedia(editSlideshow.images, 'images') : [];
      const newVideoUrls = editSlideshow.videos.length > 0 ? await uploadMedia(editSlideshow.videos, 'videos') : [];
      
      // تحديد المحتوى النهائي
      let finalImageUrls = newImageUrls;
      let finalVideoUrls = newVideoUrls;
      
      if (editSlideshow.keepExistingMedia) {
        finalImageUrls = [...(editingSlideshow.images || []), ...newImageUrls];
        finalVideoUrls = [...(editingSlideshow.video_urls || []), ...newVideoUrls];
      }
      
      console.log('✅ Media processed successfully:', { finalImageUrls, finalVideoUrls });
      
      // تحديث السلايدشو
      const { error } = await supabase
        .from('account_slideshows')
        .update({
          title: editSlideshow.title,
          images: finalImageUrls,
          video_urls: finalVideoUrls,
          media_type: editSlideshow.mediaType,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSlideshow.id)
        .eq('account_id', accountId);

      if (error) {
        console.error('❌ Error updating slideshow:', error);
        throw new Error(`فشل في تحديث السلايدات: ${error.message}`);
      }

      console.log('✅ Slideshow updated successfully');

      toast({
        title: 'تم تحديث السلايدات بنجاح',
        description: editSlideshow.title
      });

      setEditSlideshow({ title: '', images: [], videos: [], mediaType: 'images', keepExistingMedia: true });
      setShowEditForm(false);
      setEditingSlideshow(null);
      
      await fetchSlideshows();
      
    } catch (error: any) {
      console.error('❌ Error in updateSlideshow:', error);
      toast({
        title: 'خطأ في تحديث السلايدات',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // دوال اختيار الملفات للتعديل
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setEditSlideshow(prev => ({ ...prev, images: files }));
    }
  };

  const handleEditVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setEditSlideshow(prev => ({ ...prev, videos: files }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* قائمة السلايد شوز */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {t('slideshow_management')} ({slideshows.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} size="sm" variant="outline" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t('refresh')}
                </Button>
                <Button onClick={() => setShowAddForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add_slideshow_btn')}
                </Button>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
              <p className="font-medium">النظام الحالي:</p>
              <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                <li>يمكن تنشيط سلايد شو واحد فقط في كل مرة.</li>
                <li>دعم الصور والفيديوهات مع الصوت.</li>
                <li>الفيديوهات: حد أقصى 3 دقائق، الصوت مفعل.</li>
                <li>كل عنصر يعرض لمدة 15 ثواني (الصور) أو كامل المدة (الفيديو).</li>
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
                      <div className="flex items-center gap-2">
                        {getMediaTypeIcon(slideshow.media_type || 'images')}
                        <h3 className="font-semibold">{slideshow.title}</h3>
                      </div>
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
                            handleEditSlideshow(slideshow);
                          }}
                          title="تعديل السلايد شو"
                        >
                          <Edit className="h-4 w-4" />
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
                      <span>{getTotalMediaCount(slideshow)} عنصر</span>
                      <span>{slideshow.images?.length || 0} صورة</span>
                      <span>{slideshow.video_urls?.length || 0} فيديو</span>
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
                    <Label htmlFor="mediaType">نوع المحتوى</Label>
                    <Select 
                      value={newSlideshow.mediaType} 
                      onValueChange={(value: 'images' | 'videos' | 'mixed') => 
                        setNewSlideshow({ ...newSlideshow, mediaType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="images">صور فقط</SelectItem>
                        <SelectItem value="videos">فيديوهات فقط</SelectItem>
                        <SelectItem value="mixed">صور وفيديوهات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(newSlideshow.mediaType === 'images' || newSlideshow.mediaType === 'mixed') && (
                    <div>
                      <Label htmlFor="images">رفع الصور</Label>
                      <Input 
                        id="images" 
                        type="file" 
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                      {newSlideshow.images.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          تم اختيار {newSlideshow.images.length} صورة
                        </p>
                      )}
                    </div>
                  )}

                  {(newSlideshow.mediaType === 'videos' || newSlideshow.mediaType === 'mixed') && (
                    <div>
                      <Label htmlFor="videos">رفع الفيديوهات</Label>
                      <Input 
                        id="videos" 
                        type="file" 
                        multiple
                        accept="video/*"
                        onChange={handleVideoSelect}
                      />
                      {newSlideshow.videos.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          تم اختيار {newSlideshow.videos.length} فيديو
                        </p>
                      )}
                      <p className="text-xs text-red-500 mt-1">
                        الحد الأقصى لمدة الفيديو: 3 دقائق
                      </p>
                    </div>
                  )}

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
                        setNewSlideshow({ title: '', images: [], videos: [], mediaType: 'images' });
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* نموذج تعديل سلايد شو */}
            {showEditForm && editingSlideshow && (
              <div className="mt-6 border-t pt-6">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">تعديل: {editingSlideshow.title}</h4>
                  <p className="text-sm text-blue-700">
                    المحتوى الحالي: {editingSlideshow.images?.length || 0} صورة، {editingSlideshow.video_urls?.length || 0} فيديو
                  </p>
                </div>
                
                <form onSubmit={updateSlideshow} className="space-y-4">
                  <div>
                    <Label htmlFor="editTitle">عنوان السلايد شو</Label>
                    <Input 
                      id="editTitle" 
                      type="text" 
                      value={editSlideshow.title} 
                      onChange={(e) => setEditSlideshow({ ...editSlideshow, title: e.target.value })} 
                      placeholder="اسم السلايد شو" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="editMediaType">نوع المحتوى</Label>
                    <Select 
                      value={editSlideshow.mediaType} 
                      onValueChange={(value: 'images' | 'videos' | 'mixed') => 
                        setEditSlideshow({ ...editSlideshow, mediaType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="images">صور فقط</SelectItem>
                        <SelectItem value="videos">فيديوهات فقط</SelectItem>
                        <SelectItem value="mixed">صور وفيديوهات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="keepExistingMedia"
                      checked={editSlideshow.keepExistingMedia}
                      onChange={(e) => setEditSlideshow({ ...editSlideshow, keepExistingMedia: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="keepExistingMedia" className="text-sm">
                      الاحتفاظ بالمحتوى الحالي وإضافة محتوى جديد
                    </Label>
                  </div>

                  {(editSlideshow.mediaType === 'images' || editSlideshow.mediaType === 'mixed') && (
                    <div>
                      <Label htmlFor="editImages">
                        {editSlideshow.keepExistingMedia ? 'إضافة صور جديدة' : 'استبدال جميع الصور'}
                      </Label>
                      <Input 
                        id="editImages" 
                        type="file" 
                        multiple
                        accept="image/*"
                        onChange={handleEditImageSelect}
                      />
                      {editSlideshow.images.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          تم اختيار {editSlideshow.images.length} صورة جديدة
                        </p>
                      )}
                    </div>
                  )}

                  {(editSlideshow.mediaType === 'videos' || editSlideshow.mediaType === 'mixed') && (
                    <div>
                      <Label htmlFor="editVideos">
                        {editSlideshow.keepExistingMedia ? 'إضافة فيديوهات جديدة' : 'استبدال جميع الفيديوهات'}
                      </Label>
                      <Input 
                        id="editVideos" 
                        type="file" 
                        multiple
                        accept="video/*"
                        onChange={handleEditVideoSelect}
                      />
                      {editSlideshow.videos.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          تم اختيار {editSlideshow.videos.length} فيديو جديد
                        </p>
                      )}
                      <p className="text-xs text-red-500 mt-1">
                        الحد الأقصى لمدة الفيديو: 3 دقائق
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={uploading}>
                      {uploading ? <Upload className="h-4 w-4 mr-2 animate-spin" /> : null}
                      {uploading ? 'جاري التحديث...' : 'تحديث'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingSlideshow(null);
                        setEditSlideshow({ title: '', images: [], videos: [], mediaType: 'images', keepExistingMedia: true });
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
                {getTotalMediaCount(selectedSlideshow)} عنصر - 
                {selectedSlideshow.images?.length || 0} صورة - 
                {selectedSlideshow.video_urls?.length || 0} فيديو
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

// مكون معاينة السلايدات المحدث
const SlideshowPreview: React.FC<{ slideshow: Slideshow }> = ({ slideshow }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoEnded, setIsVideoEnded] = useState(false);

  // دمج الصور والفيديوهات في مصفوفة واحدة
  const allMedia = [
    ...(slideshow.images || []).map(url => ({ url, type: 'image' })),
    ...(slideshow.video_urls || []).map(url => ({ url, type: 'video' }))
  ];

  useEffect(() => {
    if (allMedia.length <= 1) return;

    const currentMedia = allMedia[currentMediaIndex];
    
    // إذا كان العنصر الحالي صورة، ننتقل بعد 15 ثانية
    if (currentMedia.type === 'image') {
      const interval = setInterval(() => {
        setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
      }, 15000);

      return () => clearInterval(interval);
    }
    
    // إذا كان فيديو، ننتظر انتهاءه
    if (currentMedia.type === 'video' && isVideoEnded) {
      const timeout = setTimeout(() => {
        setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
        setIsVideoEnded(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [allMedia.length, currentMediaIndex, isVideoEnded]);

  if (allMedia.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <p className="text-gray-500">لا توجد وسائط</p>
      </div>
    );
  }

  const currentMedia = allMedia[currentMediaIndex];

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden bg-black">
      {currentMedia.type === 'image' ? (
        <img 
          src={currentMedia.url} 
          alt={`Media ${currentMediaIndex + 1}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <video 
          key={currentMedia.url}
          src={currentMedia.url}
          className="w-full h-full object-cover"
          controls={false}
          autoPlay
          muted={false}
          onEnded={() => setIsVideoEnded(true)}
        />
      )}
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {allMedia.map((media, index) => (
          <div 
            key={index} 
            className={`w-2 h-2 rounded-full ${
              index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
            }`} 
          />
        ))}
      </div>
      
      <div className="absolute top-4 right-4 bg-black/70 rounded-full p-2">
        {currentMedia.type === 'video' ? (
          <Video className="h-4 w-4 text-white" />
        ) : (
          <Images className="h-4 w-4 text-white" />
        )}
      </div>
    </div>
  );
};

export default SlideshowManager;
