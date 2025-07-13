
import React, { useState, useEffect } from 'react';
import { useBreakTimers } from '@/hooks/useBreakTimers';
import BreakTimerDisplay from './BreakTimerDisplay';

interface BreakTimer {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  position: string;
  account_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BreakTimerDisplayContainerProps {
  accountId: string;
  branchId?: string | null;
  onActivityChange: (isActive: boolean) => void;
}

const BreakTimerDisplayContainer: React.FC<BreakTimerDisplayContainerProps> = ({
  accountId,
  branchId,
  onActivityChange
}) => {
  const [activeTimers, setActiveTimers] = useState<BreakTimer[]>([]);
  const { fetchActiveTimers } = useBreakTimers(accountId);

  const fetchTimers = async () => {
    try {
      const timers = await fetchActiveTimers(accountId);
      
      // Filter timers based on branch using localStorage
      let filteredTimers = timers || [];
      
      if (branchId) {
        // If we're in a specific branch, show only that branch's content
        filteredTimers = filteredTimers.filter(timer => {
          const timerBranchId = localStorage.getItem(`timer_branch_${timer.id}`);
          return timerBranchId === branchId;
        });
      } else {
        // If we're in main account view, show only global content (no branch association)
        filteredTimers = filteredTimers.filter(timer => {
          const timerBranchId = localStorage.getItem(`timer_branch_${timer.id}`);
          return !timerBranchId;
        });
      }

      // Filter by current time to show only active timers
      const now = new Date();
      const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      
      const currentlyActiveTimers = filteredTimers.filter(timer => {
        const [startHours, startMinutes] = timer.start_time.split(':').map(Number);
        const [endHours, endMinutes] = timer.end_time.split(':').map(Number);
        
        const startTimeSeconds = startHours * 3600 + startMinutes * 60;
        const endTimeSeconds = endHours * 3600 + endMinutes * 60;
        
        return currentTime >= startTimeSeconds && currentTime < endTimeSeconds;
      });

      console.log('🔍 Active break timers for branch:', branchId || 'main', 'count:', currentlyActiveTimers.length);
      
      setActiveTimers(currentlyActiveTimers);
      onActivityChange(currentlyActiveTimers.length > 0);
    } catch (error) {
      console.error('❌ Error fetching active break timers:', error);
      setActiveTimers([]);
      onActivityChange(false);
    }
  };

  useEffect(() => {
    fetchTimers();
    const interval = setInterval(fetchTimers, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [accountId, branchId]);

  const handleTimerClose = (timerId: string) => {
    setActiveTimers(prev => {
      const updated = prev.filter(timer => timer.id !== timerId);
      onActivityChange(updated.length > 0);
      return updated;
    });
  };

  if (activeTimers.length === 0) {
    return null;
  }

  return (
    <>
      {activeTimers.map(timer => (
        <BreakTimerDisplay
          key={timer.id}
          timer={timer}
          onClose={() => handleTimerClose(timer.id)}
        />
      ))}
    </>
  );
};

export default BreakTimerDisplayContainer;
