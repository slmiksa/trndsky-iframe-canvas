
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, EyeOff, Trash2, Clock } from 'lucide-react';
import { useBreakTimers } from '@/hooks/useBreakTimers';

interface BreakTimer {
  id: string;
  account_id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  position: string;
  created_at: string;
}

interface BreakTimerManagerProps {
  accountId: string;
  branchId?: string | null;
}

const BreakTimerManager: React.FC<BreakTimerManagerProps> = ({ accountId, branchId }) => {
  console.log('🔍 BreakTimerManager rendered with accountId:', accountId, 'branchId:', branchId);
  
  const {
    timers,
    loading,
    createTimer,
    updateTimer,
    deleteTimer,
  } = useBreakTimers(accountId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTimer, setNewTimer] = useState({
    title: '',
    start_time: '',
    end_time: '',
    position: 'center',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter timers by branch if branchId is provided
  const filteredTimers = branchId 
    ? timers.filter(timer => {
        // For localStorage implementation, we'll store branch_id in the timer data
        const timerBranchId = localStorage.getItem(`timer_branch_${timer.id}`);
        return timerBranchId === branchId;
      })
    : timers.filter(timer => {
        // Show only main account timers (no branch association)
        const timerBranchId = localStorage.getItem(`timer_branch_${timer.id}`);
        return !timerBranchId;
      });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Starting timer creation with data:', {
      accountId,
      branchId,
      title: newTimer.title,
      start_time: newTimer.start_time,
      end_time: newTimer.end_time,
      position: newTimer.position,
    });

    if (!newTimer.title.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال عنوان المؤقت",
        variant: "destructive",
      });
      return;
    }

    if (!newTimer.start_time || !newTimer.end_time) {
      toast({
        title: "خطأ",
        description: "يجب تحديد وقت البدء والانتهاء",
        variant: "destructive",
      });
      return;
    }

    if (newTimer.start_time >= newTimer.end_time) {
      toast({
        title: "خطأ",
        description: "وقت البدء يجب أن يكون قبل وقت الانتهاء",
        variant: "destructive",
      });
      return;
    }

    if (!accountId) {
      console.error('❌ No accountId provided');
      toast({
        title: "خطأ",
        description: "لم يتم العثور على معرف الحساب",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const timerData = {
        account_id: accountId,
        branch_id: branchId,
        title: newTimer.title,
        start_time: newTimer.start_time,
        end_time: newTimer.end_time,
        is_active: true,
        position: newTimer.position,
      };

      console.log('💾 Creating timer with data:', timerData);

      const result = await createTimer(timerData);

      // Store branch association in localStorage
      if (branchId && result?.id) {
        localStorage.setItem(`timer_branch_${result.id}`, branchId);
      }

      console.log('✅ Timer created successfully:', result);
      toast({
        title: "تم إنشاء المؤقت",
        description: "تم إنشاء مؤقت البريك بنجاح",
      });

      // Reset form
      setNewTimer({
        title: '',
        start_time: '',
        end_time: '',
        position: 'center',
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('❌ Error creating timer:', error);
      toast({
        title: "خطأ في إنشاء المؤقت",
        description: `حدث خطأ أثناء إنشاء المؤقت: ${error.message || 'خطأ غير معروف'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTimerStatus = async (timer: BreakTimer) => {
    try {
      await updateTimer(timer.id, {
        is_active: !timer.is_active,
      });

      toast({
        title: "تم تحديث المؤقت",
        description: `تم ${!timer.is_active ? 'تفعيل' : 'إيقاف'} المؤقت`,
      });
    } catch (error) {
      console.error('Error updating timer:', error);
      toast({
        title: "خطأ في تحديث المؤقت",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTimer = async (id: string) => {
    try {
      await deleteTimer(id);
      
      // Remove branch association from localStorage
      localStorage.removeItem(`timer_branch_${id}`);
      
      toast({
        title: "تم حذف المؤقت",
        description: "تم حذف المؤقت بنجاح",
      });
    } catch (error) {
      console.error('Error deleting timer:', error);
      toast({
        title: "خطأ في حذف المؤقت",
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
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
            <Clock className="h-5 w-5" />
            إدارة مؤقتات البريك ({filteredTimers.length})
          </CardTitle>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                إضافة مؤقت
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إنشاء مؤقت بريك جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان المؤقت *</Label>
                  <Input
                    id="title"
                    value={newTimer.title}
                    onChange={(e) => setNewTimer({ ...newTimer, title: e.target.value })}
                    placeholder="مثال: مؤقت البريك"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="start_time">وقت البدء *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={newTimer.start_time}
                    onChange={(e) => setNewTimer({ ...newTimer, start_time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_time">وقت الانتهاء *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={newTimer.end_time}
                    onChange={(e) => setNewTimer({ ...newTimer, end_time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="position">موضع المؤقت</Label>
                  <select
                    id="position"
                    value={newTimer.position}
                    onChange={(e) => setNewTimer({ ...newTimer, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="center">المنتصف</option>
                    <option value="top-right">أعلى اليمين</option>
                    <option value="top-left">أعلى اليسار</option>
                    <option value="top-center">أعلى الوسط</option>
                    <option value="bottom-right">أسفل اليمين</option>
                    <option value="bottom-left">أسفل اليسار</option>
                    <option value="bottom-center">أسفل الوسط</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء المؤقت'}
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
        {filteredTimers.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد مؤقتات بعد</p>
            <p className="text-sm text-gray-500">ابدأ بإنشاء مؤقت بريك جديد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTimers.map((timer) => (
              <div
                key={timer.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <h3 className="font-semibold">{timer.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={timer.is_active ? "default" : "secondary"}>
                      {timer.is_active ? 'نشط' : 'متوقف'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleTimerStatus(timer)}
                    >
                      {timer.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTimer(timer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-6 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">البدء:</span>
                    {formatTime(timer.start_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">الانتهاء:</span>
                    {formatTime(timer.end_time)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>الموضع: {timer.position}</span>
                  <span>{new Date(timer.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BreakTimerManager;
