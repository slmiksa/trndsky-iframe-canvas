// أنواع قاعدة البيانات المخصصة

export type AccountStatus = 'active' | 'suspended' | 'pending';

export interface Account {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  database_name: string;
  status: AccountStatus | null;
  rotation_interval: number;
  activation_start_date: string | null;
  activation_end_date: string | null;
  is_subscription_active: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SuperAdmin {
  id: string;
  username: string;
  password_hash: string;
  created_at: string | null;
}

export interface UserRole {
  id: string;
  user_id: string | null;
  account_id: string | null;
  role: string;
  created_at: string | null;
}

export interface AccountSlideshow {
  id: string;
  account_id: string;
  title: string;
  images: string[];
  video_urls: string[] | null;
  media_type: string | null;
  interval_seconds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsTicker {
  id: string;
  account_id: string;
  title: string;
  content: string | null;
  display_order: number | null;
  is_active: boolean;
  background_color: string | null;
  text_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
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

export interface BreakTimer {
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

export interface AccountWebsite {
  id: string;
  account_id: string | null;
  website_url: string;
  website_title: string | null;
  iframe_content: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SubscriptionRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RenewalNotification {
  id: string;
  account_id: string;
  notification_type: string;
  sent_at: string;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  account_id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}
