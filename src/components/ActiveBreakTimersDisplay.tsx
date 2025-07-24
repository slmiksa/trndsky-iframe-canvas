
import React, { useState, useEffect, useRef } from 'react';
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
  const mountedRef = useRef(true);
  const lastFetchRef = useRef<string>('');

  const fetchActiveTimers = async () => {
    if (!accountId || !mountedRef.current) return;

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

      if (!mountedRef.current) return;

      // منع التحديثات المتكررة للبيانات المتطابقة
      const dataSignature = JSON.stringify(data || []);
      if (lastFetchRef.current === dataSignature) {
        console.log('✅ Timer data unchanged, skipping update');
        return;
      }
      
      lastFetchRef.current = dataSignature;
      console.log('✅ Active break timers fetched:', data);
      setActiveTimers(data || []);
    } catch (error) {
      console.error('❌ Error in fetchActiveTimers:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchActiveTimers();
    
    return () => {
      mountedRef.current = false;
    };
  }, [accountId]);

  // الاشتراك في التحديثات المباشرة
  useEffect(() => {
    if (!accountId || !mountedRef.current) return;

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
          if (mountedRef.current) {
            console.log('📡 Break timer change detected, re-fetching.');
            fetchActiveTimers();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  const handleTimerClose = (timerId: string) => {
    if (!mountedRef.current) return;
    setActiveTimers(prev => prev.filter(timer => timer.id !== timerId));
  };

  const isTimerActive = (timer: BreakTimer) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const startTimeParts = timer.start_time.split(':');
    const endTimeParts = timer.end_time.split(':');
    
    const startHours = parseInt(startTimeParts[0]);
    const startMinutes = parseInt(startTimeParts[1]);
    const endHours = parseInt(endTimeParts[0]);
    const endMinutes = parseInt(endTimeParts[1]);
    
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
  };

  if (loading || !mountedRef.current) {
    return null;
  }

  const visibleTimers = activeTimers.filter(timer => isTimerActive(timer));
  
  if (visibleTimers.length === 0) {
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
