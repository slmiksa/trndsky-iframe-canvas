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
    
    // فحص دوري كل دقيقة لتحديث حالة المؤقتات
    const timeCheckInterval = setInterval(() => {
      console.log('🔄 فحص دوري لحالة المؤقتات');
      // إعادة رسم المكون لتحديث المؤقتات المرئية
      setActiveTimers(prev => [...prev]);
    }, 60000); // كل دقيقة
    
    return () => {
      clearInterval(timeCheckInterval);
    };
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
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const [startHours, startMinutes] = timer.start_time.split(':').map(Number);
    const [endHours, endMinutes] = timer.end_time.split(':').map(Number);
    
    // تحويل الوقت إلى دقائق للمقارنة السهلة
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    console.log(`🔍 Timer Check: "${timer.title}"`);
    console.log(`📅 Current Time: ${currentHours}:${currentMinutes.toString().padStart(2, '0')} (${currentTotalMinutes} minutes)`);
    console.log(`🟢 Start Time: ${startHours}:${startMinutes.toString().padStart(2, '0')} (${startTotalMinutes} minutes)`);
    console.log(`🔴 End Time: ${endHours}:${endMinutes.toString().padStart(2, '0')} (${endTotalMinutes} minutes)`);
    
    // التحقق من أن الوقت الحالي في النطاق المطلوب (متضمناً الحدود)
    const isActive = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
    
    console.log(`⏰ Timer "${timer.title}" is ${isActive ? '✅ ACTIVE' : '❌ INACTIVE'} - Reason: ${
      currentTotalMinutes < startTotalMinutes ? 'قبل وقت البداية' : 
      currentTotalMinutes >= endTotalMinutes ? 'بعد وقت النهاية' : 
      'في الوقت المحدد'
    }`);
    
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