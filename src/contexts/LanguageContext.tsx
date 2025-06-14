
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  ar: {
    // Header
    'client_dashboard': 'لوحة تحكم العميل',
    'account_id': 'معرف الحساب',
    'public_page': 'الصفحة العامة',
    'logout': 'تسجيل الخروج',
    
    // Account Status
    'subscription_status': 'حالة الاشتراك',
    'subscription_start_date': 'تاريخ بداية الاشتراك',
    'subscription_end_date': 'تاريخ انتهاء الاشتراك',
    'suspended': 'معلق',
    'pending_activation': 'في انتظار التفعيل',
    'active': 'نشط',
    'expired': 'منتهي الصلاحية',
    'expires_in_days': 'ينتهي خلال {days} أيام',
    'expires_in_day': 'ينتهي خلال {days} يوم',
    'renew_subscription': 'تجديد الاشتراك الآن',
    'contact_us': 'تواصل معنا',
    'warning_expiring_soon': 'تنبيه: اشتراكك قارب على الانتهاء',
    'warning_expiring_message': 'لضمان استمرارية الخدمة، يرجى تجديد اشتراكك قبل انتهاء التاريخ المحدد.',
    'account_suspended': 'حساب معلق',
    'account_suspended_message': 'تم تعليق حسابك. يرجى التواصل معنا لتفعيل الحساب مرة أخرى.',
    'pending_activation_title': 'في انتظار التفعيل',
    'pending_activation_message': 'حسابك في انتظار التفعيل. سيتم تفعيله قريباً.',
    
    // Tabs
    'websites': 'المواقع',
    'notifications': 'الإشعارات',
    'timers': 'مؤقتات البريك',
    'news': 'شريط الأخبار',
    'slideshows': 'السلايدات',
    
    // Websites
    'add_website': 'إضافة موقع',
    'website_url': 'رابط الموقع',
    'website_title': 'عنوان الموقع (اختياري)',
    'website_name': 'اسم الموقع',
    'add': 'إضافة',
    'cancel': 'إلغاء',
    'stopped': 'متوقف',
    'no_title_website': 'موقع بدون عنوان',
    'no_websites_yet': 'لا توجد مواقع بعد',
    'website_preview': 'معاينة الموقع',
    'select_website_preview': 'اختر موقعاً لمعاينته',
    'loading': 'جاري التحميل...',
    
    // Slideshows
    'add_slideshow': 'إضافة سلايدات',
    'slideshow_title': 'عنوان السلايدات',
    'upload_images': 'رفع الصور',
    'slideshow_interval': 'مدة عرض كل صورة (ثواني)',
    'no_slideshows_yet': 'لا توجد سلايدات بعد',
    'slideshow_preview': 'معاينة السلايدات',
    'select_slideshow_preview': 'اختر سلايدات لمعاينتها',
    'slideshow_activated_others_stopped': 'تم تفعيل السلايدات وإيقاف السلايدات الأخرى تلقائياً',
    'slideshow_stopped': 'تم إيقاف السلايدات',
    'slideshow_deleted': 'تم حذف السلايدات',
    'slideshow_added_successfully': 'تم إضافة السلايدات بنجاح',
    'error_adding_slideshow': 'خطأ في إضافة السلايدات',
    'error_updating_slideshow': 'خطأ في تحديث السلايدات',
    'error_deleting_slideshow': 'خطأ في حذف السلايدات',
    'images_count': 'عدد الصور: {count}',
    
    // Messages
    'website_added_successfully': 'تم إضافة الموقع بنجاح',
    'website_status_updated': 'تم تحديث حالة الموقع',
    'website_activated_others_stopped': 'تم تفعيل الموقع وإيقاف المواقع الأخرى تلقائياً',
    'website_stopped': 'تم إيقاف الموقع',
    'website_deleted': 'تم حذف الموقع',
    'website_deleted_successfully': 'تم حذف الموقع بنجاح',
    'link_copied': 'تم نسخ الرابط',
    'public_page_link_copied': 'تم نسخ رابط الصفحة العامة إلى الحافظة',
    'error_loading_websites': 'خطأ في تحميل المواقع',
    'error': 'خطأ',
    'account_id_not_found': 'لم يتم العثور على معرف الحساب',
    'error_adding_website': 'خطأ في إضافة الموقع',
    'error_updating_website': 'خطأ في تحديث الموقع',
    'error_deleting_website': 'خطأ في حذف الموقع',
    
    // Language
    'language': 'اللغة',
    'arabic': 'العربية',
    'english': 'English'
  },
  en: {
    // Header
    'client_dashboard': 'Client Dashboard',
    'account_id': 'Account ID',
    'public_page': 'Public Page',
    'logout': 'Logout',
    
    // Account Status
    'subscription_status': 'Subscription Status',
    'subscription_start_date': 'Subscription Start Date',
    'subscription_end_date': 'Subscription End Date',
    'suspended': 'Suspended',
    'pending_activation': 'Pending Activation',
    'active': 'Active',
    'expired': 'Expired',
    'expires_in_days': 'Expires in {days} days',
    'expires_in_day': 'Expires in {days} day',
    'renew_subscription': 'Renew Subscription Now',
    'contact_us': 'Contact Us',
    'warning_expiring_soon': 'Warning: Your subscription is expiring soon',
    'warning_expiring_message': 'To ensure service continuity, please renew your subscription before the specified date.',
    'account_suspended': 'Account Suspended',
    'account_suspended_message': 'Your account has been suspended. Please contact us to reactivate your account.',
    'pending_activation_title': 'Pending Activation',
    'pending_activation_message': 'Your account is pending activation. It will be activated soon.',
    
    // Tabs
    'websites': 'Websites',
    'notifications': 'Notifications',
    'timers': 'Break Timers',
    'news': 'News Ticker',
    'slideshows': 'Slideshows',
    
    // Websites
    'add_website': 'Add Website',
    'website_url': 'Website URL',
    'website_title': 'Website Title (Optional)',
    'website_name': 'Website Name',
    'add': 'Add',
    'cancel': 'Cancel',
    'stopped': 'Stopped',
    'no_title_website': 'Untitled Website',
    'no_websites_yet': 'No websites yet',
    'website_preview': 'Website Preview',
    'select_website_preview': 'Select a website to preview',
    'loading': 'Loading...',
    
    // Slideshows
    'add_slideshow': 'Add Slideshow',
    'slideshow_title': 'Slideshow Title',
    'upload_images': 'Upload Images',
    'slideshow_interval': 'Display Duration per Image (seconds)',
    'no_slideshows_yet': 'No slideshows yet',
    'slideshow_preview': 'Slideshow Preview',
    'select_slideshow_preview': 'Select a slideshow to preview',
    'slideshow_activated_others_stopped': 'Slideshow activated and other slideshows stopped automatically',
    'slideshow_stopped': 'Slideshow stopped',
    'slideshow_deleted': 'Slideshow deleted',
    'slideshow_added_successfully': 'Slideshow added successfully',
    'error_adding_slideshow': 'Error adding slideshow',
    'error_updating_slideshow': 'Error updating slideshow',
    'error_deleting_slideshow': 'Error deleting slideshow',
    'images_count': 'Images count: {count}',
    
    // Messages
    'website_added_successfully': 'Website added successfully',
    'website_status_updated': 'Website status updated',
    'website_activated_others_stopped': 'Website activated and other websites stopped automatically',
    'website_stopped': 'Website stopped',
    'website_deleted': 'Website deleted',
    'website_deleted_successfully': 'Website deleted successfully',
    'link_copied': 'Link copied',
    'public_page_link_copied': 'Public page link copied to clipboard',
    'error_loading_websites': 'Error loading websites',
    'error': 'Error',
    'account_id_not_found': 'Account ID not found',
    'error_adding_website': 'Error adding website',
    'error_updating_website': 'Error updating website',
    'error_deleting_website': 'Error deleting website',
    
    // Language
    'language': 'Language',
    'arabic': 'العربية',
    'english': 'English'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('dashboard-language');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('dashboard-language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
