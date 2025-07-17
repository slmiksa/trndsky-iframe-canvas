import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Video, Plus, Play, Pause, Trash2, Upload } from 'lucide-react';
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
  const [newVideo, setNewVideo] = useState({
    title: '',
    video_url: ''
  });

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

  // Add new video
  const addVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVideo.title.trim() || !newVideo.video_url.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('➕ إضافة فيديو جديد:', newVideo);
      
      const { error } = await supabase
        .from('account_videos' as any)
        .insert({
          account_id: accountId,
          title: newVideo.title.trim(),
          video_url: newVideo.video_url.trim(),
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

      setNewVideo({ title: '', video_url: '' });
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
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  <Upload className="h-4 w-4 mr-2" />
                  إضافة الفيديو
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewVideo({ title: '', video_url: '' });
                  }}
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