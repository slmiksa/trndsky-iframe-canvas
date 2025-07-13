import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, EyeOff, Trash2, Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface Notification {
  id: string;
  account_id: string;
  title: string;
  message: string;
  image_url: string | null;
  position: string;
  display_duration: number;
  is_active: boolean;
  created_at: string;
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
  } = useNotifications(accountId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter notifications by branch if branchId is provided
  const filteredNotifications = branchId 
    ? notifications.filter(notification => {
        // For localStorage implementation, we'll store branch_id in the notification data
        const notificationBranchId = localStorage.getItem(`notification_branch_${notification.id}`);
        return notificationBranchId === branchId;
      })
    : notifications.filter(notification => {
        // Show only main account notifications (no branch association)
        const notificationBranchId = localStorage.getItem(`notification_branch_${notification.id}`);
        return !notificationBranchId;
      });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال عنوان ورسالة الإشعار",
        variant: "destructive",
      });
      return;
    }

    if (!accountId) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على معرف الحساب",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const notificationData = {
        account_id: accountId,
        title: newNotification.title,
        message: newNotification.message,
        image_url: null,
        position: 'top-right',
        display_duration: 5,
        is_active: true,
      };

      const result = await createNotification(notificationData);

      // Store branch association in localStorage
      if (branchId && result && result[0]?.id) {
        localStorage.setItem(`notification_branch_${result[0].id}`, branchId);
      }

      toast({
        title: "تم إنشاء الإشعار",
        description: "تم إنشاء إشعار جديد بنجاح",
      });

      // Reset form
      setNewNotification({
        title: '',
        message: '',
      });
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error creating notification:', error);
      toast({
        title: "خطأ في إنشاء الإشعار",
        description: `حدث خطأ أثناء إنشاء الإشعار: ${error.message || 'خطأ غير معروف'}`,
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
      
      // Remove branch association from localStorage
      localStorage.removeItem(`notification_branch_${id}`);
      
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
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            إدارة الإشعارات ({filteredNotifications.length})
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
                <DialogTitle>إنشاء إشعار جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان الإشعار *</Label>
                  <Input
                    id="title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="مثال: تنبيه هام"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">نص الإشعار *</Label>
                  <Input
                    id="message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="نص الإشعار الذي سيظهر للمستخدمين"
                    required
                  />
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
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد إشعارات بعد</p>
            <p className="text-sm text-gray-500">ابدأ بإنشاء إشعار جديد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
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
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                <div className="text-xs text-gray-500">
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
