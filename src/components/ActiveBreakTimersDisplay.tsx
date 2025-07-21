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
      console.log('🔍 تفاصيل المؤقتات المستلمة من قاعدة البيانات:');
      data?.forEach((timer, index) => {
        console.log(`Timer ${index + 1}:`, {
          id: timer.id,
          title: timer.title,
          start_time: timer.start_time,
          end_time: timer.end_time,
          is_active: timer.is_active,
          position: timer.position
        });
      });
      setActiveTimers(data || []);
    } catch (error) {
      console.error('❌ Error in fetchActiveTimers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTimers();
    
    // فحص دوري كل 30 ثانية لتحديث حالة المؤقتات
    const timeCheckInterval = setInterval(() => {
      console.log('🔄 فحص دوري لحالة المؤقتات - كل 30 ثانية');
      setActiveTimers(prev => [...prev]); // إجبار إعادة الرسم
    }, 30000);
    
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
    
    // استخراج الوقت من قاعدة البيانات (إزالة الثواني إذا وجدت)
    const startTimeParts = timer.start_time.split(':');
    const endTimeParts = timer.end_time.split(':');
    
    const startHours = parseInt(startTimeParts[0]);
    const startMinutes = parseInt(startTimeParts[1]);
    const endHours = parseInt(endTimeParts[0]);
    const endMinutes = parseInt(endTimeParts[1]);
    
    // تحويل الوقت إلى دقائق للمقارنة
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    console.log(`🔍 Timer Check: "${timer.title}"`);
    console.log(`📅 Current Time: ${currentHours}:${currentMinutes.toString().padStart(2, '0')} (${currentTotalMinutes} minutes total)`);
    console.log(`🟢 Start Time: ${startHours}:${startMinutes.toString().padStart(2, '0')} (${startTotalMinutes} minutes total)`);
    console.log(`🔴 End Time: ${endHours}:${endMinutes.toString().padStart(2, '0')} (${endTotalMinutes} minutes total)`);
    console.log(`📊 Database start_time raw: "${timer.start_time}"`);
    console.log(`📊 Database end_time raw: "${timer.end_time}"`);
    
    // التحقق الصارم: يجب أن يكون الوقت الحالي بين وقت البداية والنهاية
    const isInTimeRange = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
    
    console.log(`⏰ Timer "${timer.title}" is ${isInTimeRange ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    
    if (!isInTimeRange) {
      if (currentTotalMinutes < startTotalMinutes) {
        console.log(`❌ سبب عدم الظهور: الوقت الحالي قبل وقت البداية بـ ${startTotalMinutes - currentTotalMinutes} دقيقة`);
      } else {
        console.log(`❌ سبب عدم الظهور: الوقت الحالي بعد وقت النهاية بـ ${currentTotalMinutes - endTotalMinutes} دقيقة`);
      }
    }
    
    return isInTimeRange;
  };

  const visibleTimers = activeTimers.filter(timer => {
    const shouldShow = isTimerActive(timer);
    console.log(`🎯 Filter result for "${timer.title}": ${shouldShow ? 'SHOW' : 'HIDE'}`);
    return shouldShow;
  });
  
  console.log(`📊 مجموع المؤقتات النشطة: ${activeTimers.length}`);
  console.log(`👁️ المؤقتات المرئية بعد الفلترة: ${visibleTimers.length}`);
  console.log(`🕐 الوقت الحالي الكامل: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}`);
  
  if (visibleTimers.length === 0) {
    console.log('✅ لا توجد مؤقتات للعرض - إرجاع null');
    return null;
  }

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