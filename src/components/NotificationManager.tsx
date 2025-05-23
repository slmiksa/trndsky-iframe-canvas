
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, EyeOff, Trash2, Upload } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface Notification {
  id: string;
  account_id: string;
  title: string;
  message: string | null;
  image_url: string | null;
  is_active: boolean;
  position: string;
  display_duration: number;
  created_at: string;
}

interface NotificationManagerProps {
  accountId: string;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ accountId }) => {
  const {
    notifications,
    loading,
    createNotification,
    updateNotification,
    deleteNotification,
    uploadImage,
  } = useNotifications(accountId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    position: 'top-right',
    display_duration: 5000,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotification.title.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال عنوان الإشعار",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage, accountId);
      }

      await createNotification({
        account_id: accountId,
        title: newNotification.title,
        message: newNotification.message || null,
        image_url: imageUrl,
        is_active: true,
        position: newNotification.position,
        display_duration: newNotification.display_duration,
      });

      toast({
        title: "تم إنشاء الإشعار",
        description: "تم إنشاء الإشعار بنجاح",
      });

      // Reset form
      setNewNotification({
        title: '',
        message: '',
        position: 'top-right',
        display_duration: 5000,
      });
      setSelectedImage(null);
      setImagePreview(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "خطأ في إنشاء الإشعار",
        description: "حدث خطأ أثناء إنشاء الإشعار",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleNotificationStatus = async (notification: Notification) => {
    try {
      await updateNotification(notification.id, {
        is_active: !notification.is_active,
      });

      toast({
        title: "تم تحديث الإشعار",
        description: `تم ${!notification.is_active ? 'تفعيل' : 'إيقاف'} الإشعار`,
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: "خطأ في تحديث الإشعار",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      toast({
        title: "تم حذف الإشعار",
        description: "تم حذف الإشعار بنجاح",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "خطأ في حذف الإشعار",
        variant: "destructive",
      });
    }
  };

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
          <CardTitle>إدارة الإشعارات ({notifications.length})</CardTitle>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                إضافة إشعار
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إنشاء إشعار جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان الإشعار *</Label>
                  <Input
                    id="title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="عنوان الإشعار"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">رسالة الإشعار</Label>
                  <Input
                    id="message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="محتوى الرسالة (اختياري)"
                  />
                </div>

                <div>
                  <Label htmlFor="position">موضع الإشعار</Label>
                  <select
                    id="position"
                    value={newNotification.position}
                    onChange={(e) => setNewNotification({ ...newNotification, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="top-right">أعلى اليمين</option>
                    <option value="top-left">أعلى اليسار</option>
                    <option value="top-center">أعلى الوسط</option>
                    <option value="bottom-right">أسفل اليمين</option>
                    <option value="bottom-left">أسفل اليسار</option>
                    <option value="bottom-center">أسفل الوسط</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="duration">مدة العرض (بالميللي ثانية)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1000"
                    step="1000"
                    value={newNotification.display_duration}
                    onChange={(e) => setNewNotification({ ...newNotification, display_duration: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="image">صورة الإشعار (اختياري)</Label>
                  <div className="mt-2">
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedImage ? 'تغيير الصورة' : 'رفع صورة'}
                    </Button>
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="معاينة"
                          className="w-full h-32 object-cover rounded-md border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الإشعار'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
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
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">لا توجد إشعارات بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{notification.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={notification.is_active ? "default" : "secondary"}>
                      {notification.is_active ? 'نشط' : 'متوقف'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleNotificationStatus(notification)}
                    >
                      {notification.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {notification.message && (
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                )}
                {notification.image_url && (
                  <div className="mb-2">
                    <img
                      src={notification.image_url}
                      alt={notification.title}
                      className="w-20 h-20 object-cover rounded border"
                    />
                  </div>
                )}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>الموضع: {notification.position}</span>
                  <span>المدة: {notification.display_duration}ms</span>
                  <span>{new Date(notification.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationManager;
