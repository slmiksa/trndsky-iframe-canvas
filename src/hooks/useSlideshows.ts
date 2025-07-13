
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Slideshow {
  id: string;
  account_id: string;
  title: string;
  images: string[];
  interval_seconds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branch_id?: string | null;
}

export const useSlideshows = (accountId?: string, branchId?: string | null) => {
  const [slideshows, setSlideshows] = useState<Slideshow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlideshows = async () => {
    if (!accountId) return;

    try {
      console.log('🔍 Fetching slideshows for account:', accountId, 'branch:', branchId);
      
      const { data, error } = await supabase
        .from('account_slideshows')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching slideshows:', error);
        throw error;
      }

      // Filter slideshows based on branch using localStorage
      let filteredSlideshows = data || [];
      
      if (branchId) {
        // If we're in a specific branch, show only that branch's content
        filteredSlideshows = filteredSlideshows.filter(slide => {
          const slideBranchId = localStorage.getItem(`slideshow_branch_${slide.id}`);
          return slideBranchId === branchId;
        });
      } else {
        // If we're in main account view, show only global content (no branch association)
        filteredSlideshows = filteredSlideshows.filter(slide => {
          const slideBranchId = localStorage.getItem(`slideshow_branch_${slide.id}`);
          return !slideBranchId;
        });
      }

      console.log('✅ Slideshows fetched for branch:', branchId || 'main', 'count:', filteredSlideshows.length);
      setSlideshows(filteredSlideshows);
    } catch (error) {
      console.error('❌ Error in fetchSlideshows:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSlideshow = async (slideshowData: Omit<Slideshow, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('➕ Creating slideshow:', slideshowData);
      
      // Remove branch_id from the data since it's not in the database schema yet
      const { branch_id, ...dataWithoutBranchId } = slideshowData;
      
      const { data, error } = await supabase
        .from('account_slideshows')
        .insert(dataWithoutBranchId)
        .select();

      if (error) {
        console.error('❌ Error creating slideshow:', error);
        throw error;
      }

      console.log('✅ Slideshow created successfully:', data);
      
      // Store branch association in localStorage if branch_id provided
      if (branch_id && data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(`slideshow_branch_${data[0].id}`, branch_id);
      }
      
      fetchSlideshows();
      return data?.[0];
    } catch (error) {
      console.error('❌ Error in createSlideshow:', error);
      throw error;
    }
  };

  const updateSlideshow = async (id: string, updates: Partial<Slideshow>) => {
    try {
      console.log('🔄 Updating slideshow:', id, updates);
      
      // Remove branch_id from updates since it's not in the database schema yet
      const { branch_id, ...updatesWithoutBranchId } = updates;
      
      const { error } = await supabase
        .from('account_slideshows')
        .update(updatesWithoutBranchId)
        .eq('id', id);

      if (error) {
        console.error('❌ Error updating slideshow:', error);
        throw error;
      }

      console.log('✅ Slideshow updated successfully');
      fetchSlideshows();
    } catch (error) {
      console.error('❌ Error in updateSlideshow:', error);
      throw error;
    }
  };

  const deleteSlideshow = async (id: string) => {
    try {
      console.log('🗑️ Deleting slideshow:', id);
      
      const { error } = await supabase
        .from('account_slideshows')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting slideshow:', error);
        throw error;
      }

      console.log('✅ Slideshow deleted successfully');
      
      // Remove branch association from localStorage
      localStorage.removeItem(`slideshow_branch_${id}`);
      
      fetchSlideshows();
    } catch (error) {
      console.error('❌ Error in deleteSlideshow:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSlideshows();
  }, [accountId, branchId]);

  return {
    slideshows,
    loading,
    fetchSlideshows,
    createSlideshow,
    updateSlideshow,
    deleteSlideshow,
  };
};
