
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Images, Eye, EyeOff, Trash2, Upload } from 'lucide-react';
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

  const fetchSlideshows = async () => {
    try {
      console.log('🔍 Fetching slideshows for account:', accountId);
      
      // Use service role for custom auth system
      const { data, error } = await supabase
        .from('account_slideshows')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching slideshows:', error);
        throw error;
      }

      console.log('✅ Slideshows fetched successfully:', data);
      setSlideshows(data || []);
    } catch (error) {
      console.error('❌ Error in fetchSlideshows:', error);
      toast({
        title: t('error'),
        description: 'خطأ في تحميل السلايدات',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlideshows();
  }, [accountId]);

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${accountId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('slideshow-images')
        .upload(fileName, file);

      if (error) {
        console.error('❌ Error uploading file:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('slideshow-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const addSlideshow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSlideshow.images.length === 0) {
      toast({
        title: t('error'),
        description: 'يرجى اختيار صور للسلايدات',
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      console.log('📤 Uploading images and creating slideshow');
      
      const imageUrls = await uploadImages(newSlideshow.images);
      
      // Use RPC call to bypass RLS since we're using custom auth
      const { data, error } = await supabase.rpc('create_slideshow_bypass_rls', {
        p_account_id: accountId,
        p_title: newSlideshow.title,
        p_images: imageUrls,
        p_interval_seconds: newSlideshow.interval_seconds
      });

      if (error) {
        console.error('❌ Error creating slideshow via RPC:', error);
        // Fallback to direct insert
        const { error: insertError } = await supabase
          .from('account_slideshows')
          .insert({
            account_id: accountId,
            title: newSlideshow.title,
            images: imageUrls,
            interval_seconds: newSlideshow.interval_seconds,
            is_active: false
          });

        if (insertError) {
          console.error('❌ Error inserting slideshow:', insertError);
          throw insertError;
        }
      }

      console.log('✅ Slideshow added successfully');
      toast({
        title: t('slideshow_added_successfully'),
        description: newSlideshow.title
      });

      setNewSlideshow({ title: '', interval_seconds: 5, images: [] });
      setShowAddForm(false);
      fetchSlideshows();
    } catch (error: any) {
      console.error('❌ Error in addSlideshow:', error);
      toast({
        title: t('error_adding_slideshow'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleSlideshowStatus = async (slideshowId: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Toggling slideshow status:', { slideshowId, currentStatus });

      if (!currentStatus) {
        // Stop all active slideshows first
        const { error: deactivateError } = await supabase
          .from('account_slideshows')
          .update({ is_active: false })
          .eq('account_id', accountId)
          .eq('is_active', true);

        if (deactivateError) {
          console.error('❌ Error stopping active slideshows:', deactivateError);
          throw deactivateError;
        }
      }

      const { error } = await supabase
        .from('account_slideshows')
        .update({ is_active: !currentStatus })
        .eq('id', slideshowId);

      if (error) {
        console.error('❌ Error updating slideshow status:', error);
        throw error;
      }

      const statusMessage = !currentStatus ? t('slideshow_activated_others_stopped') : t('slideshow_stopped');
      toast({
        title: 'تم تحديث حالة السلايدات',
        description: statusMessage
      });

      fetchSlideshows();
    } catch (error: any) {
      console.error('❌ Error in toggleSlideshowStatus:', error);
      toast({
        title: t('error_updating_slideshow'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteSlideshow = async (slideshowId: string) => {
    try {
      console.log('🗑️ Deleting slideshow:', slideshowId);
      
      const slideshow = slideshows.find(s => s.id === slideshowId);
      if (slideshow && slideshow.images) {
        // Delete images from storage
        for (const imageUrl of slideshow.images) {
          const fileName = imageUrl.split('/').pop();
          if (fileName) {
            await supabase.storage
              .from('slideshow-images')
              .remove([`${accountId}/${fileName}`]);
          }
        }
      }

      const { error } = await supabase
        .from('account_slideshows')
        .delete()
        .eq('id', slideshowId);

      if (error) {
        console.error('❌ Error deleting slideshow:', error);
        throw error;
      }

      console.log('✅ Slideshow deleted successfully');
      toast({
        title: t('slideshow_deleted'),
        description: 'تم حذف السلايدات بنجاح'
      });

      setSelectedSlideshow(null);
      fetchSlideshows();
    } catch (error: any) {
      console.error('❌ Error in deleteSlideshow:', error);
      toast({
        title: t('error_deleting_slideshow'),
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* قائمة السلايدات */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {t('slideshows')} ({slideshows.length})
              </CardTitle>
              <Button onClick={() => setShowAddForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('add_slideshow')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">{t('loading')}</p>
              </div>
            ) : slideshows.length === 0 ? (
              <div className="text-center py-8">
                <Images className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">{t('no_slideshows_yet')}</p>
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
                          {slideshow.is_active ? t('active') : t('stopped')}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSlideshowStatus(slideshow.id, slideshow.is_active);
                          }}
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
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{t('images_count').replace('{count}', slideshow.images.length.toString())}</span>
                      <span>{slideshow.interval_seconds}s</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(slideshow.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* نموذج إضافة سلايدات */}
            {showAddForm && (
              <div className="mt-6 border-t pt-6">
                <form onSubmit={addSlideshow} className="space-y-4">
                  <div>
                    <Label htmlFor="title">{t('slideshow_title')}</Label>
                    <Input 
                      id="title" 
                      type="text" 
                      value={newSlideshow.title} 
                      onChange={(e) => setNewSlideshow({ ...newSlideshow, title: e.target.value })} 
                      placeholder="اسم السلايدات" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="interval">{t('slideshow_interval')}</Label>
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
                    <Label htmlFor="images">{t('upload_images')}</Label>
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
                      {uploading ? 'جاري الرفع...' : t('add')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false);
                        setNewSlideshow({ title: '', interval_seconds: 5, images: [] });
                      }}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* معاينة السلايدات */}
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>
              {selectedSlideshow ? selectedSlideshow.title : t('slideshow_preview')}
            </CardTitle>
            {selectedSlideshow && (
              <p className="text-sm text-gray-600">
                {t('images_count').replace('{count}', selectedSlideshow.images.length.toString())} - {selectedSlideshow.interval_seconds}s
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
                  <p>{t('select_slideshow_preview')}</p>
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
