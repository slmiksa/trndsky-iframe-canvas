
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Upload, Trash2, Eye, EyeOff, Move, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface GalleryManagerProps {
  accountId: string;
}

const GalleryManager: React.FC<GalleryManagerProps> = ({ accountId }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [newImage, setNewImage] = useState({
    file: null as File | null,
    title: '',
    description: '',
    display_order: 0,
  });

  const fetchImages = async () => {
    try {
      console.log('🖼️ Fetching gallery images for account:', accountId);
      
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('account_id', accountId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching gallery images:', error);
        throw error;
      }

      console.log('✅ Gallery images fetched:', data);
      setImages(data || []);
    } catch (error: any) {
      console.error('❌ Error in fetchImages:', error);
      toast({
        title: "خطأ في تحميل الصور",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [accountId]);

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${accountId}/${fileName}`;

    console.log('📤 Uploading image:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('gallery-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('❌ Error uploading image:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(filePath);

    console.log('✅ Image uploaded successfully:', publicUrl);
    return publicUrl;
  };

  const addImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImage.file) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const imageUrl = await uploadImage(newImage.file);

      const { error } = await supabase
        .from('gallery_images')
        .insert({
          account_id: accountId,
          image_url: imageUrl,
          title: newImage.title || null,
          description: newImage.description || null,
          display_order: newImage.display_order,
          is_active: true,
        });

      if (error) {
        console.error('❌ Error adding image to gallery:', error);
        throw error;
      }

      console.log('✅ Image added to gallery successfully');
      toast({
        title: "تم إضافة الصورة بنجاح",
        description: `تم إضافة ${newImage.title || 'الصورة'} إلى المعرض`,
      });

      setNewImage({ file: null, title: '', description: '', display_order: 0 });
      setShowAddForm(false);
      fetchImages();
    } catch (error: any) {
      console.error('❌ Error in addImage:', error);
      toast({
        title: "خطأ في إضافة الصورة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleImageStatus = async (imageId: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Toggling image status:', { imageId, currentStatus });

      const { error } = await supabase
        .from('gallery_images')
        .update({ is_active: !currentStatus })
        .eq('id', imageId);

      if (error) {
        console.error('❌ Error updating image status:', error);
        throw error;
      }

      console.log('✅ Image status updated successfully');
      toast({
        title: "تم تحديث حالة الصورة",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} الصورة`,
      });

      fetchImages();
    } catch (error: any) {
      console.error('❌ Error in toggleImageStatus:', error);
      toast({
        title: "خطأ في تحديث الصورة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteImage = async (imageId: string, imageUrl: string) => {
    try {
      console.log('🗑️ Deleting image:', imageId);

      // Delete from database first
      const { error: dbError } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('❌ Error deleting image from database:', dbError);
        throw dbError;
      }

      // Extract file path from URL and delete from storage
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${accountId}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('gallery-images')
        .remove([filePath]);

      if (storageError) {
        console.warn('⚠️ Warning: Could not delete file from storage:', storageError);
      }

      console.log('✅ Image deleted successfully');
      toast({
        title: "تم حذف الصورة",
        description: "تم حذف الصورة بنجاح",
      });

      setSelectedImage(null);
      fetchImages();
    } catch (error: any) {
      console.error('❌ Error in deleteImage:', error);
      toast({
        title: "خطأ في حذف الصورة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              معرض الصور ({images.length})
            </CardTitle>
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              إضافة صورة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8">
              <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">لا توجد صور في المعرض بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video">
                    <img
                      src={image.image_url}
                      alt={image.title || 'صورة'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge variant={image.is_active ? "default" : "secondary"} className="text-xs">
                        {image.is_active ? 'نشط' : 'متوقف'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleImageStatus(image.id, image.is_active)}
                      >
                        {image.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="secondary">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{image.title || 'صورة'}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <img
                              src={image.image_url}
                              alt={image.title || 'صورة'}
                              className="w-full max-h-96 object-contain rounded"
                            />
                            {image.description && (
                              <p className="text-gray-600">{image.description}</p>
                            )}
                            <div className="flex justify-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteImage(image.id, image.image_url)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                حذف الصورة
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-1">
                      {image.title || 'صورة بدون عنوان'}
                    </h3>
                    {image.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {image.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        الترتيب: {image.display_order}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(image.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* نموذج إضافة صورة */}
          {showAddForm && (
            <div className="mt-6 border-t pt-6">
              <form onSubmit={addImage} className="space-y-4">
                <div>
                  <Label htmlFor="image-file">الصورة</Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewImage({ ...newImage, file });
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="image-title">عنوان الصورة (اختياري)</Label>
                  <Input
                    id="image-title"
                    type="text"
                    value={newImage.title}
                    onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                    placeholder="عنوان الصورة"
                  />
                </div>
                <div>
                  <Label htmlFor="image-description">وصف الصورة (اختياري)</Label>
                  <Textarea
                    id="image-description"
                    value={newImage.description}
                    onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                    placeholder="وصف الصورة"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="display-order">ترتيب العرض</Label>
                  <Input
                    id="display-order"
                    type="number"
                    value={newImage.display_order}
                    onChange={(e) => setNewImage({ ...newImage, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    إضافة الصورة
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewImage({ file: null, title: '', description: '', display_order: 0 });
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
  );
};

export default GalleryManager;
