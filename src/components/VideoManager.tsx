import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Video, Plus, Play, Pause, Trash2, Upload, Link, FileVideo } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';

interface VideoItem {
  id: string;
  title: string;
  video_url: string;
  is_active: boolean;
  account_id: string;
  created_at: string;
  updated_at: string;
}

interface VideoManagerProps {
  accountId: string;
}

const VideoManager: React.FC<VideoManagerProps> = ({ accountId }) => {
  const { t } = useLanguage();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [newVideo, setNewVideo] = useState({
    title: '',
    video_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch videos
  const fetchVideos = async () => {
    try {
      console.log('🎥 جلب قائمة الفيديوهات للحساب:', accountId);
      
      const { data, error } = await supabase
        .from('account_videos' as any)
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ في جلب الفيديوهات:', error);
        throw error;
      }

      console.log('✅ تم جلب الفيديوهات:', data?.length || 0);
      setVideos((data || []) as unknown as VideoItem[]);
    } catch (error: any) {
      console.error('❌ خطأ في fetchVideos:', error);
      toast({
        title: "خطأ في تحميل الفيديوهات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchVideos();
  }, [accountId]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "نوع ملف غير صحيح",
          description: "يرجى اختيار ملف فيديو صالح",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير جداً",
          description: "يجب أن يكون حجم الملف أقل من 100 ميجابايت",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      // Auto-fill title if empty
      if (!newVideo.title) {
        setNewVideo(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  // Upload file to Supabase Storage
  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${accountId}/${Date.now()}.${fileExt}`;
    
    console.log('📤 رفع الملف:', fileName);
    
    // Start progress simulation
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);
    
    try {
      const { data, error } = await supabase.storage
        .from('account-videos')
        .upload(fileName, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (error) {
        console.error('❌ خطأ في رفع الملف:', error);
        throw new Error(`فشل في رفع الملف: ${error.message}`);
      }
      
      console.log('✅ تم رفع الملف بنجاح:', data.path);
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('account-videos')
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  // Add new video
  const addVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVideo.title.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال عنوان الفيديو",
        variant: "destructive"
      });
      return;
    }

    if (uploadMethod === 'url' && !newVideo.video_url.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال رابط الفيديو",
        variant: "destructive"
      });
      return;
    }

    if (uploadMethod === 'file' && !selectedFile) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار ملف الفيديو",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setIsUploading(true);
    
    try {
      console.log('➕ إضافة فيديو جديد:', newVideo);
      
      let videoUrl = newVideo.video_url;
      
      // Upload file if method is file
      if (uploadMethod === 'file' && selectedFile) {
        videoUrl = await uploadFile(selectedFile);
      }
      
      const { error } = await supabase
        .from('account_videos' as any)
        .insert({
          account_id: accountId,
          title: newVideo.title.trim(),
          video_url: videoUrl,
          is_active: false
        });

      if (error) {
        console.error('❌ خطأ في إضافة الفيديو:', error);
        throw error;
      }

      console.log('✅ تم إضافة الفيديو بنجاح');
      toast({
        title: "تم إضافة الفيديو",
        description: `تم إضافة الفيديو "${newVideo.title}" بنجاح`
      });

      // Reset form
      setNewVideo({ title: '', video_url: '' });
      setSelectedFile(null);
      setUploadProgress(0);
      setShowAddForm(false);
      fetchVideos();
    } catch (error: any) {
      console.error('❌ خطأ في addVideo:', error);
      toast({
        title: "خطأ في إضافة الفيديو",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  // Toggle video status
  const toggleVideoStatus = async (videoId: string, currentStatus: boolean) => {
    try {
      console.log('🔄 تغيير حالة الفيديو:', { videoId, currentStatus });

      // If activating, deactivate all other videos first
      if (!currentStatus) {
        console.log('🛑 إيقاف جميع الفيديوهات النشطة قبل تفعيل الفيديو الجديد');
        const { error: deactivateError } = await supabase
          .from('account_videos' as any)
          .update({ is_active: false })
          .eq('account_id', accountId)
          .eq('is_active', true);

        if (deactivateError) {
          console.error('❌ خطأ في إيقاف الفيديوهات النشطة:', deactivateError);
          throw deactivateError;
        }
      }

      const { error } = await supabase
        .from('account_videos' as any)
        .update({ is_active: !currentStatus })
        .eq('id', videoId);

      if (error) {
        console.error('❌ خطأ في تحديث حالة الفيديو:', error);
        throw error;
      }

      console.log('✅ تم تحديث حالة الفيديو بنجاح');
      
      const statusMessage = !currentStatus 
        ? "تم تشغيل الفيديو وإيقاف الفيديوهات الأخرى" 
        : "تم إيقاف الفيديو";
      
      toast({
        title: "تم تحديث حالة الفيديو",
        description: statusMessage
      });

      fetchVideos();
    } catch (error: any) {
      console.error('❌ خطأ في toggleVideoStatus:', error);
      toast({
        title: "خطأ في تحديث الفيديو",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Delete video
  const deleteVideo = async (videoId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
      return;
    }

    try {
      console.log('🗑️ حذف الفيديو:', videoId);
      
      const { error } = await supabase
        .from('account_videos' as any)
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('❌ خطأ في حذف الفيديو:', error);
        throw error;
      }

      console.log('✅ تم حذف الفيديو بنجاح');
      toast({
        title: "تم حذف الفيديو",
        description: "تم حذف الفيديو بنجاح"
      });

      fetchVideos();
    } catch (error: any) {
      console.error('❌ خطأ في deleteVideo:', error);
      toast({
        title: "خطأ في حذف الفيديو",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Video className="h-4 w-4" />
        <AlertDescription>
          يمكنك إضافة فيديوهات لعرضها على الشاشة كاملة. يمكن تشغيل فيديو واحد فقط في كل مرة.
          <br />
          <strong>صيغ الفيديو المدعومة:</strong> MP4, WebM, OGV
          <br />
          <strong>ملاحظة:</strong> تأكد من أن رابط الفيديو يمكن الوصول إليه عبر الإنترنت.
        </AlertDescription>
      </Alert>

      {/* Add Video Form */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              إدارة الفيديوهات ({videos.length})
            </CardTitle>
            <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              إضافة فيديو
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {showAddForm && (
            <form onSubmit={addVideo} className="space-y-4 p-4 border rounded-lg bg-gray-50 mb-6">
              <div>
                <Label htmlFor="video-title">عنوان الفيديو</Label>
                <Input
                  id="video-title"
                  type="text"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  placeholder="أدخل عنوان الفيديو"
                  required
                />
              </div>
              
              {/* Upload Method Selection */}
              <div>
                <Label>طريقة إضافة الفيديو</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="url"
                      checked={uploadMethod === 'url'}
                      onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                    />
                    <Link className="h-4 w-4" />
                    <span>رابط خارجي</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="file"
                      checked={uploadMethod === 'file'}
                      onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                    />
                    <FileVideo className="h-4 w-4" />
                    <span>رفع من الجهاز</span>
                  </label>
                </div>
              </div>
              
              {uploadMethod === 'url' ? (
                <div>
                  <Label htmlFor="video-url">رابط الفيديو</Label>
                  <Input
                    id="video-url"
                    type="url"
                    value={newVideo.video_url}
                    onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    يجب أن يكون رابطاً مباشراً لملف الفيديو (ينتهي بـ .mp4 أو .webm أو .ogv)
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="video-file">اختر ملف الفيديو</Label>
                  <Input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                    required
                  />
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <p><strong>الملف المختار:</strong> {selectedFile.name}</p>
                      <p><strong>الحجم:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} ميجابايت</p>
                    </div>
                  )}
                  {isUploading && uploadProgress > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>جاري الرفع...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    الصيغ المدعومة: MP4, WebM, OGV، الحد الأقصى: 100 ميجابايت
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading || isUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'جاري الرفع...' : 'إضافة الفيديو'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewVideo({ title: '', video_url: '' });
                    setSelectedFile(null);
                    setUploadProgress(0);
                  }}
                  disabled={isUploading}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          )}

          {/* Videos List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">لا توجد فيديوهات مضافة بعد</p>
              <p className="text-sm text-gray-500 mt-2">
                اضغط على "إضافة فيديو" لإضافة أول فيديو
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div 
                  key={video.id} 
                  className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
                      <p className="text-sm text-gray-600 break-all">{video.video_url}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        تم الإنشاء: {new Date(video.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant={video.is_active ? "default" : "secondary"}>
                        {video.is_active ? "نشط" : "متوقف"}
                      </Badge>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => toggleVideoStatus(video.id, video.is_active)}
                        title={video.is_active ? "إيقاف الفيديو" : "تشغيل الفيديو"}
                      >
                        {video.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteVideo(video.id)}
                        title="حذف الفيديو"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoManager;