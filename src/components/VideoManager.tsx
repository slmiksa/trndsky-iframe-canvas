import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, Plus, Trash2, Edit, Video, Upload } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  video_url: string;
  is_active: boolean;
  created_at: string;
  account_id: string;
  branch_id?: string | null;
}

interface VideoManagerProps {
  accountId: string;
  branchId?: string | null;
}

const VideoManager: React.FC<VideoManagerProps> = ({ accountId, branchId }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const { toast } = useToast();

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('🎥 Fetching videos for account:', accountId, 'branch:', branchId);
      
      // Use type assertion to work around TypeScript issues
      const { data, error } = await (supabase as any)
        .from('account_videos')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching videos:', error);
        // If table doesn't exist yet, just set empty array
        if (error.code === '42P01') {
          console.log('📝 account_videos table not found, setting empty array');
          setVideos([]);
          return;
        }
        throw error;
      }

      console.log('✅ Videos fetched:', data);
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل الفيديوهات",
        variant: "destructive"
      });
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchVideos();
    }
  }, [accountId, branchId]);

  const createVideo = async () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان الفيديو ورابط الفيديو",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsCreating(true);
      console.log('🎥 Creating video:', { title: newVideoTitle, url: newVideoUrl });

      const { data, error } = await (supabase as any)
        .from('account_videos')
        .insert([
          {
            account_id: accountId,
            title: newVideoTitle.trim(),
            video_url: newVideoUrl.trim(),
            is_active: false,
            branch_id: branchId
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating video:', error);
        if (error.code === '42P01') {
          toast({
            title: "خطأ",
            description: "جدول الفيديوهات غير موجود. يرجى التأكد من تطبيق migration للقاعدة",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      console.log('✅ Video created successfully:', data);
      
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الفيديو بنجاح",
      });

      setNewVideoTitle('');
      setNewVideoUrl('');
      fetchVideos();
    } catch (error) {
      console.error('Error creating video:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إضافة الفيديو",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateVideo = async () => {
    if (!editingVideo || !editingVideo.title.trim() || !editingVideo.video_url.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان الفيديو ورابط الفيديو",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log('🎥 Updating video:', editingVideo.id);

      const { data, error } = await (supabase as any)
        .from('account_videos')
        .update({
          title: editingVideo.title.trim(),
          video_url: editingVideo.video_url.trim(),
        })
        .eq('id', editingVideo.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating video:', error);
        throw error;
      }

      console.log('✅ Video updated successfully:', data);
      
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الفيديو بنجاح",
      });

      setEditingVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث الفيديو",
        variant: "destructive"
      });
    }
  };

  const toggleVideoStatus = async (videoId: string, currentStatus: boolean) => {
    try {
      console.log('🎥 Toggling video status:', videoId, 'from', currentStatus, 'to', !currentStatus);

      const { error } = await (supabase as any)
        .from('account_videos')
        .update({ is_active: !currentStatus })
        .eq('id', videoId);

      if (error) {
        console.error('❌ Error toggling video status:', error);
        throw error;
      }

      console.log('✅ Video status toggled successfully');
      
      toast({
        title: "تم بنجاح",
        description: !currentStatus ? "تم تفعيل الفيديو" : "تم إيقاف الفيديو",
      });
      
      fetchVideos();
    } catch (error) {
      console.error('Error toggling video status:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تغيير حالة الفيديو",
        variant: "destructive"
      });
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      console.log('🎥 Deleting video:', videoId);

      const { error } = await (supabase as any)
        .from('account_videos')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('❌ Error deleting video:', error);
        throw error;
      }

      console.log('✅ Video deleted successfully');
      
      toast({
        title: "تم بنجاح",
        description: "تم حذف الفيديو بنجاح",
      });
      
      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف الفيديو",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📤 Uploading video file:', file.name, 'Size:', formatFileSize(file.size));

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف فيديو صالح",
        variant: "destructive"
      });
      return;
    }

    // Check file size (increase limit to 200MB for better user experience)
    const maxSizeBytes = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSizeBytes) {
      toast({
        title: "خطأ",
        description: `حجم الملف كبير جداً (${formatFileSize(file.size)}). الحد الأقصى ${formatFileSize(maxSizeBytes)}`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploadingFile(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `video_${Date.now()}.${fileExt}`;
      const filePath = `${accountId}/${fileName}`;
      
      // Try to upload the file directly first
      console.log('📤 Starting upload to path:', filePath);
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        
        // Handle specific error cases
        if (uploadError.message.includes('exceeded the maximum allowed size')) {
          toast({
            title: "خطأ",
            description: `حجم الملف كبير جداً (${formatFileSize(file.size)}). يرجى اختيار ملف أصغر من ${formatFileSize(maxSizeBytes)}`,
            variant: "destructive"
          });
          return;
        }
        
        if (uploadError.message.includes('Bucket not found')) {
          toast({
            title: "خطأ",
            description: "مساحة التخزين غير متوفرة. يرجى المحاولة لاحقاً",
            variant: "destructive"
          });
          return;
        }
        
        throw uploadError;
      }
      
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);
        
      setNewVideoUrl(urlData.publicUrl);
      
      console.log('✅ Video file uploaded successfully:', urlData.publicUrl);
      
      toast({
        title: "تم بنجاح",
        description: "تم رفع الفيديو بنجاح"
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في رفع الفيديو. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Filter videos based on branch
  const filteredVideos = videos.filter(video => {
    if (branchId) {
      return video.branch_id === branchId;
    } else {
      return !video.branch_id;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            إضافة فيديو جديد
          </CardTitle>
          <CardDescription>
            أضف فيديو جديد ليتم عرضه على الشاشات بملء الشاشة (الحد الأقصى 200 ميجابايت)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="video-title">عنوان الفيديو</Label>
            <Input
              id="video-title"
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              placeholder="أدخل عنوان الفيديو"
            />
          </div>
          
          <div>
            <Label htmlFor="video-url">رابط الفيديو</Label>
            <Input
              id="video-url"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              type="url"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">أو</span>
            <Label htmlFor="video-file" className="cursor-pointer">
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
                <Upload className="h-4 w-4" />
                {uploadingFile ? 'جاري الرفع...' : 'رفع ملف فيديو (حتى 200 ميجا)'}
              </div>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
            </Label>
          </div>

          <Button onClick={createVideo} disabled={isCreating || uploadingFile} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'جاري الإضافة...' : 'إضافة فيديو'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">
          الفيديوهات الحالية
          {branchId && <span className="text-sm text-muted-foreground ml-2">(فرع محدد)</span>}
          {!branchId && <span className="text-sm text-muted-foreground ml-2">(الحساب الرئيسي)</span>}
        </h3>
        
        {filteredVideos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              لا توجد فيديوهات. أضف فيديو جديد للبدء.
            </CardContent>
          </Card>
        ) : (
          filteredVideos.map((video) => (
            <Card key={video.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{video.title}</h4>
                      <Badge variant={video.is_active ? "default" : "secondary"}>
                        {video.is_active ? "نشط" : "متوقف"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {video.video_url}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      تم الإنشاء: {new Date(video.created_at).toLocaleDateString('ar')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingVideo(video)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={video.is_active ? "destructive" : "default"}
                      onClick={() => toggleVideoStatus(video.id, video.is_active)}
                    >
                      {video.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف الفيديو</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذا الفيديو؟ لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteVideo(video.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
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

      {/* Edit Video Dialog */}
      {editingVideo && (
        <AlertDialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تعديل الفيديو</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-video-title">عنوان الفيديو</Label>
                <Input
                  id="edit-video-title"
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({
                    ...editingVideo,
                    title: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-video-url">رابط الفيديو</Label>
                <Input
                  id="edit-video-url"
                  value={editingVideo.video_url}
                  onChange={(e) => setEditingVideo({
                    ...editingVideo,
                    video_url: e.target.value
                  })}
                  type="url"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={updateVideo}>
                حفظ التغييرات
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default VideoManager;
