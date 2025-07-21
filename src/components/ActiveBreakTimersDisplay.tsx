import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import BreakTimerDisplay from './BreakTimerDisplay';

interface BreakTimer {
  id: string;
  account_id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  position: string;
  created_at: string;
  updated_at: string;
}

interface ActiveBreakTimersDisplayProps {
  accountId: string;
}

const ActiveBreakTimersDisplay: React.FC<ActiveBreakTimersDisplayProps> = ({ accountId }) => {
  const [activeTimers, setActiveTimers] = useState<BreakTimer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveTimers = async () => {
    if (!accountId) return;

    try {
      console.log('🔍 Fetching active break timers for account:', accountId);
      
      const { data, error } = await supabase
        .from('break_timers')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching active break timers:', error);
        return;
      }

      console.log('✅ Active break timers fetched:', data);
      setActiveTimers(data || []);
    } catch (error) {
      console.error('❌ Error in fetchActiveTimers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTimers();
  }, [accountId]);

  // الاشتراك في التحديثات المباشرة
  useEffect(() => {
    if (!accountId) return;

    const channel = supabase
      .channel(`break_timers_display_${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'break_timers',
          filter: `account_id=eq.${accountId}`
        },
        () => {
          console.log('📡 Break timer change detected, re-fetching.');
          fetchActiveTimers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  const handleTimerClose = (timerId: string) => {
    setActiveTimers(prev => prev.filter(timer => timer.id !== timerId));
  };

  if (loading) {
    return null;
  }

  // فلترة المؤقتات لعرض المؤقتات التي في وقتها الصحيح
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return { hours, minutes };
  };

  const isTimerActive = (timer: BreakTimer) => {
    const currentTime = getCurrentTime();
    const [startHours, startMinutes] = timer.start_time.split(':').map(Number);
    const [endHours, endMinutes] = timer.end_time.split(':').map(Number);
    
    // تحويل الوقت إلى دقائق للمقارنة السهلة
    const currentMinutes = currentTime.hours * 60 + currentTime.minutes;
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    
    console.log(`⏰ Timer "${timer.title}": Current time ${currentTime.hours}:${currentTime.minutes} (${currentMinutes} min), Start: ${startHours}:${startMinutes} (${startMinutesTotal} min), End: ${endHours}:${endMinutes} (${endMinutesTotal} min)`);
    
    // التحقق من أن الوقت الحالي في النطاق المطلوب
    const isActive = currentMinutes >= startMinutesTotal && currentMinutes <= endMinutesTotal;
    console.log(`⏰ Timer "${timer.title}" is ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
    
    return isActive;
  };

  const visibleTimers = activeTimers.filter(timer => isTimerActive(timer));

  return (
    <>
      {visibleTimers.map(timer => (
        <BreakTimerDisplay 
          key={timer.id}
          timer={timer}
          onClose={() => handleTimerClose(timer.id)}
        />
      ))}
    </>
  );
};

export default ActiveBreakTimersDisplay;