import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Image, Play, Pause, Eye } from 'lucide-react';
import { useSlideshows } from '@/hooks/useSlideshows';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/hooks/useLanguage';
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

interface Slideshow {
  id: string;
  account_id: string;
  title: string;
  images: string[];
  interval_seconds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branch_id?: string | null;
}

interface SlideshowManagerProps {
  accountId: string;
  branchId?: string | null;
}

const SlideshowManager: React.FC<SlideshowManagerProps> = ({ accountId, branchId }) => {
  const {
    slideshows,
    loading,
    createSlideshow,
    updateSlideshow,
    deleteSlideshow,
  } = useSlideshows(accountId, branchId);
  const { t } = useLanguage();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlideshow, setNewSlideshow] = useState({
    title: '',
    images: [] as string[],
    interval_seconds: 5,
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewSlideshow, setPreviewSlideshow] = useState<Slideshow | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPlaying && previewSlideshow) {
      intervalId = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % previewSlideshow.images.length);
      }, previewSlideshow.interval_seconds * 1000);
    }

    return () => clearInterval(intervalId);
  }, [isPlaying, previewSlideshow]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);

    const imageUrls = files.map(file => URL.createObjectURL(file));
    setNewSlideshow({ ...newSlideshow, images: imageUrls });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSlideshow.title.trim()) {
      toast({
        title: "خطأ",
        description: 'عنوان السلايدات مطلوب',
        variant: "destructive",
      });
      return;
    }

    if (newSlideshow.images.length === 0) {
      toast({
        title: "خطأ",
        description: 'يرجى رفع صورة واحدة على الأقل',
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const slideshowData = {
        account_id: accountId,
        title: newSlideshow.title,
        images: newSlideshow.images,
        interval_seconds: newSlideshow.interval_seconds,
        is_active: true,
        branch_id: branchId,
      };

      const result = await createSlideshow(slideshowData);

      toast({
        title: "نجح",
        description: 'تم إضافة السلايدات بنجاح',
      });

      setNewSlideshow({
        title: '',
        images: [],
        interval_seconds: 5,
      });
      setSelectedImages([]);
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error creating slideshow:', error);
      toast({
        title: "خطأ",
        description: `خطأ في إضافة السلايدات: ${error.message || 'خطأ غير معروف'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSlideshowStatus = async (slideshow: Slideshow) => {
    try {
      await updateSlideshow(slideshow.id, {
        is_active: !slideshow.is_active,
      });

      toast({
        title: t('success'),
        description: `تم ${!slideshow.is_active ? 'تفعيل' : 'إيقاف'} السلايدات`,
      });
    } catch (error: any) {
      console.error('Error updating slideshow:', error);
      toast({
        title: t('error'),
        description: `خطأ في تحديث السلايدات: ${error.message || 'خطأ غير معروف'}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSlideshow = async (id: string) => {
    try {
      await deleteSlideshow(id);

      toast({
        title: t('success'),
        description: 'تم حذف السلايدات',
      });
    } catch (error: any) {
      console.error('Error deleting slideshow:', error);
      toast({
        title: t('error'),
        description: `خطأ في حذف السلايدات: ${error.message || 'خطأ غير معروف'}`,
        variant: "destructive",
      });
    }
  };

  const handlePreview = (slideshow: Slideshow) => {
    setPreviewSlideshow(slideshow);
    setCurrentImageIndex(0);
    setIsPlaying(true);
  };

  const handleClosePreview = () => {
    setPreviewSlideshow(null);
    setIsPlaying(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            السلايدات ({slideshows.length})
            {branchId && <Badge variant="outline" className="text-xs">فرع: {branchId}</Badge>}
            {!branchId && <Badge variant="outline" className="text-xs">الحساب الرئيسي</Badge>}
          </CardTitle>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                إضافة سلايدات
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة سلايدات</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان السلايدات</Label>
                  <Input
                    id="title"
                    value={newSlideshow.title}
                    onChange={(e) => setNewSlideshow({ ...newSlideshow, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="images">رفع الصور</Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    onChange={handleImageUpload}
                    accept="image/*"
                    required
                  />
                  {selectedImages.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      عدد الصور: {selectedImages.length}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="interval">مدة عرض كل صورة (ثواني)</Label>
                  <Slider
                    id="interval"
                    defaultValue={[newSlideshow.interval_seconds]}
                    max={30}
                    min={3}
                    step={1}
                    onValueChange={(value) => setNewSlideshow({ ...newSlideshow, interval_seconds: value[0] })}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {newSlideshow.interval_seconds} ثواني
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'جاري الإرسال...' : 'إضافة'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {slideshows.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد سلايدات بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {slideshows.map((slideshow) => (
              <div
                key={slideshow.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-blue-500" />
                    <h3 className="font-semibold">{slideshow.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={slideshow.is_active ? "default" : "secondary"}>
                      {slideshow.is_active ? t('active') : 'متوقف'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleSlideshowStatus(slideshow)}
                    >
                      {slideshow.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePreview(slideshow)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            حذف السلايدات
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذه السلايدات؟
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSlideshow(slideshow.id)}>
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  مدة العرض: {slideshow.interval_seconds} ثواني
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(slideshow.created_at).toLocaleDateString('ar-SA')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Slideshow Preview Dialog */}
      <Dialog open={previewSlideshow !== null} onOpenChange={(open) => {
        if (!open) {
          handleClosePreview();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewSlideshow?.title || 'معاينة السلايدات'}</DialogTitle>
          </DialogHeader>
          {previewSlideshow ? (
            <div className="relative">
              <img
                src={previewSlideshow.images[currentImageIndex]}
                alt={`Slide ${currentImageIndex + 1}`}
                className="w-full h-96 object-contain rounded-lg"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge>{currentImageIndex + 1} / {previewSlideshow.images.length}</Badge>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">اختر سلايدات لمعاينتها</p>
            </div>
          )}
          <Button variant="outline" className="mt-4" onClick={handleClosePreview}>
            إغلاق
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const toggleSlideshowStatus = async (slideshow: Slideshow) => {
  try {
    await updateSlideshow(slideshow.id, {
      is_active: !slideshow.is_active,
    });

    toast({
      title: 'success',
      description: `Slideshow ${slideshow.is_active ? 'disabled' : 'enabled'}`,
    });
  } catch (error: any) {
    console.error('Error updating slideshow:', error);
    toast({
      title: 'Error',
      description: `Failed to update slideshow: ${error.message || 'Unknown error'}`,
      variant: "destructive",
    });
  }
};

const handleDeleteSlideshow = async (id: string) => {
  try {
    await deleteSlideshow(id);

    toast({
      title: 'success',
      description: 'Slideshow deleted',
    });
  } catch (error: any) {
    console.error('Error deleting slideshow:', error);
    toast({
      title: 'Error',
      description: `Failed to delete slideshow: ${error.message || 'Unknown error'}`,
      variant: "destructive",
    });
  }
};

const handlePreview = (slideshow: Slideshow) => {
  setPreviewSlideshow(slideshow);
  setCurrentImageIndex(0);
  setIsPlaying(true);
};

const handleClosePreview = () => {
  setPreviewSlideshow(null);
  setIsPlaying(false);
};

export default SlideshowManager;
