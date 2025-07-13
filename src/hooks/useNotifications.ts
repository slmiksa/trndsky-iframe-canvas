
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
  branch_id?: string | null;
}

export const useNotifications = (accountId?: string, branchId?: string | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!accountId) return;

    try {
      console.log('🔍 Fetching notifications for account:', accountId, 'branch:', branchId);
      
      // Build completely separate queries to avoid deep type instantiation
      let result: any;
      
      if (branchId) {
        result = await supabase
          .from('notifications')
          .select('*')
          .match({ 
            account_id: accountId, 
            branch_id: branchId 
          })
          .order('created_at', { ascending: false });
      } else {
        result = await supabase
          .from('notifications')
          .select('*')
          .match({ account_id: accountId })
          .is('branch_id', null)
          .order('created_at', { ascending: false });
      }
      
      const { data, error } = result;

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

  const fetchActiveNotifications = async (accountId: string, branchId?: string | null) => {
    try {
      console.log('🔍 Fetching active notifications for account:', accountId, 'branch:', branchId);
      
      // Build completely separate queries to avoid deep type instantiation
      let result: any;
      
      if (branchId) {
        result = await supabase
          .from('notifications')
          .select('*')
          .match({ 
            account_id: accountId, 
            is_active: true,
            branch_id: branchId 
          })
          .order('created_at', { ascending: false });
      } else {
        result = await supabase
          .from('notifications')
          .select('*')
          .match({ 
            account_id: accountId, 
            is_active: true 
          })
          .is('branch_id', null)
          .order('created_at', { ascending: false });
      }
      
      const { data, error } = result;

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
      console.log('📁 Starting image upload for file:', file.name);
      
      // First, ensure the bucket exists
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();

      if (bucketsError) {
        console.error('❌ Error checking buckets:', bucketsError);
      }

      const bucketExists = buckets?.some(bucket => bucket.id === 'notification-images');
      console.log('🪣 Bucket exists:', bucketExists);

      const fileExt = file.name.split('.').pop();
      const fileName = `${accountId}/${Date.now()}.${fileExt}`;

      console.log('📁 Uploading to path:', fileName);

      const { data, error: uploadError } = await supabase.storage
        .from('notification-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Error uploading image:', uploadError);
        console.error('❌ Upload error details:', JSON.stringify(uploadError, null, 2));
        throw uploadError;
      }

      console.log('✅ File uploaded successfully:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('notification-images')
        .getPublicUrl(fileName);

      console.log('✅ Public URL generated:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ Error in uploadImage:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [accountId, branchId]);

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
