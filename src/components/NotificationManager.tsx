
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Bell, Play, Pause } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
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

interface Notification {
  id: string;
  account_id: string;
  title: string;
  message?: string | null;
  image_url?: string | null;
  position: string;
  display_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branch_id?: string | null;
}

interface NotificationManagerProps {
  accountId: string;
  branchId?: string | null;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ accountId, branchId }) => {
  const {
    notifications,
    loading,
    createNotification,
    updateNotification,
    deleteNotification,
  } = useNotifications(accountId, branchId);
  const { t } = useLanguage();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    image_url: '',
    position: 'top-right',
    display_duration: 5,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const imageUrl = URL.createObjectURL(file);
      setNewNotification({ ...newNotification, image_url: imageUrl });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newNotification.title.trim()) {
      toast({
        title: "خطأ",
        description: 'عنوان الإشعار مطلوب',
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const notificationData = {
        account_id: accountId,
        title: newNotification.title,
        message: newNotification.message || null,
        image_url: newNotification.image_url || null,
        position: newNotification.position,
        display_duration: newNotification.display_duration,
        is_active: true,
        branch_id: branchId,
      };

      await createNotification(notificationData);

      toast({
        title: "نجح",
        description: 'تم إضافة الإشعار بنجاح',
      });

      setNewNotification({
        title: '',
        message: '',
        image_url: '',
        position: 'top-right',
        display_duration: 5,
      });
      setSelectedImage(null);
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error creating notification:', error);
      toast({
        title: "خطأ",
        description: `خطأ في إضافة الإشعار: ${error.message || 'خطأ غير معروف'}`,
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
        title: t('success'),
        description: `تم ${!notification.is_active ? 'تفعيل' : 'إيقاف'} الإشعار`,
      });
    } catch (error: any) {
      console.error('Error updating notification:', error);
      toast({
        title: t('error'),
        description: `خطأ في تحديث الإشعار: ${error.message || 'خطأ غير معروف'}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);

      toast({
        title: t('success'),
        description: 'تم حذف الإشعار',
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast({
        title: t('error'),
        description: `خطأ في حذف الإشعار: ${error.message || 'خطأ غير معروف'}`,
        variant: "destructive",
      });
    }
  };

  const getPositionLabel = (position: string) => {
    const positions: { [key: string]: string } = {
      'top-right': 'أعلى يمين',
      'top-left': 'أعلى يسار',
      'bottom-right': 'أسفل يمين',
      'bottom-left': 'أسفل يسار',
      'center': 'وسط الشاشة',
    };
    return positions[position] || position;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            الإشعارات ({notifications.length})
            {branchId && <Badge variant="outline" className="text-xs">فرع: {branchId}</Badge>}
            {!branchId && <Badge variant="outline" className="text-xs">الحساب الرئيسي</Badge>}
          </CardTitle>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                إضافة إشعار
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة إشعار جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان الإشعار</Label>
                  <Input
                    id="title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">رسالة الإشعار</Label>
                  <Textarea
                    id="message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="image">صورة الإشعار (اختيارية)</Label>
                  <Input
                    id="image"
                    type="file"
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                  {selectedImage && (
                    <p className="text-sm text-gray-500 mt-1">
                      تم اختيار: {selectedImage.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="position">موقع الإشعار</Label>
                  <Select value={newNotification.position} onValueChange={(value) => setNewNotification({ ...newNotification, position: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-right">أعلى يمين</SelectItem>
                      <SelectItem value="top-left">أعلى يسار</SelectItem>
                      <SelectItem value="bottom-right">أسفل يمين</SelectItem>
                      <SelectItem value="bottom-left">أسفل يسار</SelectItem>
                      <SelectItem value="center">وسط الشاشة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">مدة العرض (ثواني)</Label>
                  <Slider
                    id="duration"
                    defaultValue={[newNotification.display_duration]}
                    max={30}
                    min={3}
                    step={1}
                    onValueChange={(value) => setNewNotification({ ...newNotification, display_duration: value[0] })}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {newNotification.display_duration} ثواني
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
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <h3 className="font-semibold">{notification.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={notification.is_active ? "default" : "secondary"}>
                      {notification.is_active ? t('active') : 'متوقف'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleNotificationStatus(notification)}
                    >
                      {notification.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
                            حذف الإشعار
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذا الإشعار؟
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteNotification(notification.id)}>
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {notification.message && (
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                )}
                <div className="text-sm text-gray-500 space-y-1">
                  <div>الموقع: {getPositionLabel(notification.position)}</div>
                  <div>مدة العرض: {notification.display_duration} ثواني</div>
                  {notification.image_url && (
                    <div className="flex items-center gap-2">
                      <span>يحتوي على صورة</span>
                      <img 
                        src={notification.image_url} 
                        alt="notification" 
                        className="w-8 h-8 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(notification.created_at).toLocaleDateString('ar-SA')}
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
