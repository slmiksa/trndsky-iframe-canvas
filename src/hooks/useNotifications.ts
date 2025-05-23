
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  account_id: string;
  title: string;
  message: string | null;
  image_url: string | null;
  is_active: boolean;
  position: string;
  display_duration: number;
  created_at: string;
  updated_at: string;
}

export const useNotifications = (accountId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!accountId) return;

    try {
      console.log('🔍 Fetching notifications for account:', accountId);
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔑 Current session:', sessionData?.session ? 'Valid session' : 'No session');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        throw error;
      }

      console.log('✅ Notifications fetched:', data);
      setNotifications(data || []);
    } catch (error) {
      console.error('❌ Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveNotifications = async (accountId: string) => {
    try {
      console.log('🔍 Fetching active notifications for account:', accountId);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching active notifications:', error);
        throw error;
      }

      console.log('✅ Active notifications fetched:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Error in fetchActiveNotifications:', error);
      return [];
    }
  };

  const createNotification = async (notificationData: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('➕ Creating notification:', notificationData);
      
      // Get current session before creating notification
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔑 Session before creating notification:', 
                 sessionData?.session ? `Authenticated as ${sessionData?.session?.user?.id}` : 'No session');
      
      // Check if user roles exist for current user
      if (sessionData?.session?.user?.id) {
        const { data: userRoles, error: userRolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', sessionData.session.user.id)
          .eq('account_id', notificationData.account_id);
          
        console.log('👤 User roles for current user:', userRoles);
        
        if (userRolesError) {
          console.error('❌ Error checking user roles:', userRolesError);
        }
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) {
        console.error('❌ Error creating notification:', error);
        throw error;
      }

      console.log('✅ Notification created successfully:', data);
      fetchNotifications();
      return data;
    } catch (error) {
      console.error('❌ Error in createNotification:', error);
      throw error;
    }
  };

  const updateNotification = async (id: string, updates: Partial<Notification>) => {
    try {
      console.log('🔄 Updating notification:', id, updates);
      
      const { error } = await supabase
        .from('notifications')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('❌ Error updating notification:', error);
        throw error;
      }

      console.log('✅ Notification updated successfully');
      fetchNotifications();
    } catch (error) {
      console.error('❌ Error in updateNotification:', error);
      throw error;
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      console.log('🗑️ Deleting notification:', id);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting notification:', error);
        throw error;
      }

      console.log('✅ Notification deleted successfully');
      fetchNotifications();
    } catch (error) {
      console.error('❌ Error in deleteNotification:', error);
      throw error;
    }
  };

  const uploadImage = async (file: File, accountId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${accountId}/${Date.now()}.${fileExt}`;

      console.log('📁 Uploading image:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('notification-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('❌ Error uploading image:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('notification-images')
        .getPublicUrl(fileName);

      console.log('✅ Image uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ Error in uploadImage:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Check auth state on mount
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      console.log('🔑 Auth check on hook mount:', data?.session ? 'Authenticated' : 'Not authenticated');
    };
    
    checkAuth();
    fetchNotifications();
  }, [accountId]);

  return {
    notifications,
    loading,
    fetchNotifications,
    fetchActiveNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    uploadImage,
  };
};
