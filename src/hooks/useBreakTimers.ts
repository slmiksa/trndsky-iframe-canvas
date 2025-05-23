
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useBreakTimers = (accountId?: string) => {
  const [timers, setTimers] = useState<BreakTimer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimers = async () => {
    if (!accountId) return;

    try {
      console.log('🔍 Fetching break timers for account:', accountId);
      
      const { data, error } = await supabase
        .from('break_timers')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching break timers:', error);
        throw error;
      }

      console.log('✅ Break timers fetched:', data);
      setTimers(data || []);
    } catch (error) {
      console.error('❌ Error in fetchTimers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTimers = async (accountId: string) => {
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
        throw error;
      }

      console.log('✅ Active break timers fetched:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Error in fetchActiveTimers:', error);
      return [];
    }
  };

  const createTimer = async (timerData: Omit<BreakTimer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('➕ Creating break timer:', timerData);
      
      const { data, error } = await supabase
        .from('break_timers')
        .insert(timerData)
        .select();

      if (error) {
        console.error('❌ Error creating break timer:', error);
        throw error;
      }

      console.log('✅ Break timer created successfully:', data);
      await fetchTimers();
      return data;
    } catch (error) {
      console.error('❌ Error in createTimer:', error);
      throw error;
    }
  };

  const updateTimer = async (id: string, updates: Partial<BreakTimer>) => {
    try {
      console.log('🔄 Updating break timer:', id, updates);
      
      const { data, error } = await supabase
        .from('break_timers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Error updating break timer:', error);
        throw error;
      }

      console.log('✅ Break timer updated successfully:', data);
      await fetchTimers();
      return data;
    } catch (error) {
      console.error('❌ Error in updateTimer:', error);
      throw error;
    }
  };

  const deleteTimer = async (id: string) => {
    try {
      console.log('🗑️ Deleting break timer:', id);
      
      const { data, error } = await supabase
        .from('break_timers')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Error deleting break timer:', error);
        throw error;
      }

      console.log('✅ Break timer deleted successfully:', data);
      await fetchTimers();
      return data;
    } catch (error) {
      console.error('❌ Error in deleteTimer:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTimers();
  }, [accountId]);

  return {
    timers,
    loading,
    fetchTimers,
    fetchActiveTimers,
    createTimer,
    updateTimer,
    deleteTimer,
  };
};
