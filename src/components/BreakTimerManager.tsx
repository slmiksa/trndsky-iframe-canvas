
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
import { useLanguage } from '@/contexts/LanguageContext';

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
}

const BreakTimerManager: React.FC<BreakTimerManagerProps> = ({ accountId }) => {
  console.log('🔍 BreakTimerManager rendered with accountId:', accountId);
  
  const { t } = useLanguage();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Starting timer creation with data:', {
      accountId,
      title: newTimer.title,
      start_time: newTimer.start_time,
      end_time: newTimer.end_time,
      position: newTimer.position,
    });

    if (!newTimer.title.trim()) {
      toast({
        title: t('error'),
        description: t('timer_title'),
        variant: "destructive",
      });
      return;
    }

    if (!newTimer.start_time || !newTimer.end_time) {
      toast({
        title: t('error'),
        description: `${t('start_time')} ${t('end_time')}`,
        variant: "destructive",
      });
      return;
    }

    if (newTimer.start_time >= newTimer.end_time) {
      toast({
        title: t('error'),
        description: `${t('start_time')} ${t('end_time')}`,
        variant: "destructive",
      });
      return;
    }

    if (!accountId) {
      console.error('❌ No accountId provided');
      toast({
        title: t('error'),
        description: t('account_id_not_found'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const timerData = {
        account_id: accountId,
        title: newTimer.title,
        start_time: newTimer.start_time,
        end_time: newTimer.end_time,
        is_active: true,
        position: newTimer.position,
      };

      console.log('💾 Creating timer with data:', timerData);

      const result = await createTimer(timerData);

      console.log('✅ Timer created successfully:', result);
      toast({
        title: t('timer_created'),
        description: t('timer_created_description'),
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
        title: t('error'),
        description: `${error.message || t('error')}`,
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
        title: t('timer_updated'),
        description: `${t(!timer.is_active ? 'activated' : 'deactivated')}`,
      });
    } catch (error) {
      console.error('Error updating timer:', error);
      toast({
        title: t('error'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteTimer = async (id: string) => {
    try {
      await deleteTimer(id);
      toast({
        title: t('timer_deleted'),
        description: t('timer_deleted_description'),
      });
    } catch (error) {
      console.error('Error deleting timer:', error);
      toast({
        title: t('error'),
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
        <p className="mt-2 text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('break_timer_management')} ({timers.length})
          </CardTitle>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('add_timer')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('create_new_timer')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">{t('timer_title')} *</Label>
                  <Input
                    id="title"
                    value={newTimer.title}
                    onChange={(e) => setNewTimer({ ...newTimer, title: e.target.value })}
                    placeholder={t('timer_title_placeholder')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="start_time">{t('start_time')} *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={newTimer.start_time}
                    onChange={(e) => setNewTimer({ ...newTimer, start_time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_time">{t('end_time')} *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={newTimer.end_time}
                    onChange={(e) => setNewTimer({ ...newTimer, end_time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="position">{t('timer_position')}</Label>
                  <select
                    id="position"
                    value={newTimer.position}
                    onChange={(e) => setNewTimer({ ...newTimer, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="center">{t('position_center')}</option>
                    <option value="top-right">{t('position_top_right')}</option>
                    <option value="top-left">{t('position_top_left')}</option>
                    <option value="top-center">{t('position_top_center')}</option>
                    <option value="bottom-right">{t('position_bottom_right')}</option>
                    <option value="bottom-left">{t('position_bottom_left')}</option>
                    <option value="bottom-center">{t('position_bottom_center')}</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? t('creating') : t('create_timer')}
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
        {timers.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('no_timers_yet')}</p>
            <p className="text-sm text-gray-500">{t('no_timers_description')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timers.map((timer) => (
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
                      {timer.is_active ? t('active') : t('stopped')}
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
                    <span className="font-medium">{t('start')}:</span>
                    {formatTime(timer.start_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{t('end')}:</span>
                    {formatTime(timer.end_time)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{t('position')}: {timer.position}</span>
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
