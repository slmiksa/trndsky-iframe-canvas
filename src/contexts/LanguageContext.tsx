
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
    
     // Old Slideshows (keeping for compatibility)
    'add_slideshow': 'إضافة سلايدات',
    'slideshow_title': 'عنوان السلايدات',
    'upload_images': 'رفع الصور',
    'slideshow_interval': 'مدة عرض كل صورة (ثواني)',
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
    'english': 'English',
    
    // Notifications
    'notification_management': 'إدارة الإشعارات',
    'add_notification': 'إضافة إشعار',
    'create_new_notification': 'إنشاء إشعار جديد',
    'notification_title': 'عنوان الإشعار',
    'notification_message': 'رسالة الإشعار',
    'notification_message_placeholder': 'محتوى الرسالة (اختياري) - يمكنك كتابة عدة أسطر',
    'notification_position': 'موضع الإشعار',
    'display_duration': 'مدة العرض (بالدقائق)',
    'notification_image': 'صورة الإشعار (اختياري)',
    'upload_image': 'رفع صورة',
    'change_image': 'تغيير الصورة',
    'create_notification': 'إنشاء الإشعار',
    'creating': 'جاري الإنشاء...',
    'no_notifications_yet': 'لا توجد إشعارات بعد',
    'notification_created': 'تم إنشاء الإشعار',
    'notification_updated': 'تم تحديث الإشعار',
    'notification_deleted': 'تم حذف الإشعار',
    'activated': 'تفعيل',
    'deactivated': 'إيقاف',
    'position_top_right': 'أعلى اليمين',
    'position_top_left': 'أعلى اليسار',
    'position_top_center': 'أعلى الوسط',
    'position_center': 'المنتصف',
    'position_bottom_right': 'أسفل اليمين',
    'position_bottom_left': 'أسفل اليسار',
    'position_bottom_center': 'أسفل الوسط',
    'position': 'الموضع',
    'duration': 'المدة',
    'minutes': 'دقيقة',

    // Break Timers
    'break_timer_management': 'إدارة مؤقتات البريك',
    'add_timer': 'إضافة مؤقت',
    'create_new_timer': 'إنشاء مؤقت بريك جديد',
    'timer_title': 'عنوان المؤقت',
    'timer_title_placeholder': 'مثال: مؤقت البريك',
    'start_time': 'وقت البدء',
    'end_time': 'وقت الانتهاء',
    'timer_position': 'موضع المؤقت',
    'create_timer': 'إنشاء المؤقت',
    'no_timers_yet': 'لا توجد مؤقتات بعد',
    'no_timers_description': 'ابدأ بإنشاء مؤقت بريك جديد',
    'timer_created': 'تم إنشاء المؤقت',
    'timer_created_description': 'تم إنشاء مؤقت البريك بنجاح',
    'timer_updated': 'تم تحديث المؤقت',
    'timer_deleted': 'تم حذف المؤقت',
    'timer_deleted_description': 'تم حذف المؤقت بنجاح',
    'start': 'البدء',
    'end': 'الانتهاء',

    // News Ticker
    'news_ticker_management': 'إدارة شريط الأخبار',
    'add_news': 'إضافة خبر',
    'edit_news': 'تحرير الخبر',
    'add_new_news': 'إضافة خبر جديد',
    'news_title': 'عنوان الخبر',
    'news_title_placeholder': 'اكتب عنوان الخبر',
    'news_content': 'محتوى الخبر (اختياري)',
    'news_content_placeholder': 'اكتب تفاصيل الخبر',
    'display_order': 'ترتيب العرض',
    'update': 'تحديث',
    'saving': 'جاري الحفظ...',
    'no_news_yet': 'لا توجد أخبار بعد',
    'news_updated': 'تم تحديث الخبر بنجاح',
    'news_added': 'تم إضافة الخبر بنجاح',
    'news_deleted_title': 'تم حذف الخبر',
    'news_deleted_description': 'تم حذف الخبر بنجاح',
    'news_status_updated': 'تم تحديث حالة الخبر',
    'news_activated': 'تم تفعيل الخبر',
    'news_deactivated': 'تم إيقاف الخبر',
    'created_date': 'تم الإنشاء',

    // Slideshow
    'slideshow_management': 'السلايد شوز',
    'add_slideshow_btn': 'إضافة سلايد شو',
    'refresh': 'تحديث',
    'current_system': 'النظام الحالي',
    'slideshow_system_note_1': 'يمكن تنشيط سلايد شو واحد فقط في كل مرة.',
    'slideshow_system_note_2': 'عند تنشيط سلايد شو، سيتم إيقاف أي سلايد شو آخر نشط تلقائياً.',
    'slideshow_system_note_3': 'كل سلايد شو يعرض صوره بفترة 15 ثواني بين كل صورة.',
    'slideshow_system_note_4': 'استخدم زر العين لتفعيل/إلغاء تفعيل أي سلايد شو.',
    'no_slideshows_yet_new': 'لا توجد سلايد شوز حتى الآن',
    'slideshow_added': 'تم إضافة السلايدات بنجاح',
    'slideshow_activated_success': 'تم تشغيل السلايد شو بنجاح',
    'slideshow_deactivated_success': 'تم إيقاف السلايد شو',
    'slideshows_deleted': 'تم حذف السلايدات',
    'slideshows_deleted_description': 'تم حذف السلايدات بنجاح',
    'slideshow_preview_new': 'معاينة السلايد شو',
    'select_slideshow_to_preview': 'اختر سلايد شو لمعاينته',
    'images_word': 'صورة',
    'seconds_per_image': 'ثانية لكل صورة',
    'activate_slideshow': 'تشغيل السلايد شو',
    'deactivate_slideshow': 'إيقاف السلايد شو',
    'delete_slideshow': 'حذف السلايد شو',

    // Subscription Request Page
    'back_to_home': 'العودة للصفحة الرئيسية',
    'subscription_request_title': 'طلب الاشتراك في REMOTEWEB',
    'subscription_request_subtitle': 'انضم إلى منصة TRNDSKY وابدأ في إدارة شاشاتك ومواقعك بكفاءة عالية',
    'full_name': 'الاسم الكامل',
    'full_name_placeholder': 'أدخل اسمك الكامل',
    'email_placeholder': 'example@company.com',
    'phone_number': 'رقم التواصل',
    'phone_placeholder': '05xxxxxxxx',
    'company_name': 'اسم الشركة',
    'company_name_placeholder': 'أدخل اسم شركتك',
    'submit_request': 'إرسال طلب الاشتراك',
    'submitting': 'جاري الإرسال...',
    'name_min_error': 'الاسم يجب أن يكون على الأقل حرفين',
    'email_invalid_error': 'البريد الإلكتروني غير صحيح',
    'phone_min_error': 'رقم الهاتف يجب أن يكون على الأقل 10 أرقام',
    'company_required_error': 'اسم الشركة مطلوب',
    'request_success': 'تم إرسال طلب الاشتراك بنجاح! سنتواصل معك قريباً.',
    'email_warning': 'تم تسجيل طلبك بنجاح ولكن لم يتم إرسال الإيميل',
    'request_error': 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.'
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
    
     // Old Slideshows (keeping for compatibility)
    'add_slideshow': 'Add Slideshow',
    'slideshow_title': 'Slideshow Title',
    'upload_images': 'Upload Images',
    'slideshow_interval': 'Display Duration per Image (seconds)',
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
    'english': 'English',
    
    // Notifications
    'notification_management': 'Notification Management',
    'add_notification': 'Add Notification',
    'create_new_notification': 'Create New Notification',
    'notification_title': 'Notification Title',
    'notification_message': 'Notification Message',
    'notification_message_placeholder': 'Message content (optional) - you can write multiple lines',
    'notification_position': 'Notification Position',
    'display_duration': 'Display Duration (minutes)',
    'notification_image': 'Notification Image (optional)',
    'upload_image': 'Upload Image',
    'change_image': 'Change Image',
    'create_notification': 'Create Notification',
    'creating': 'Creating...',
    'no_notifications_yet': 'No notifications yet',
    'notification_created': 'Notification Created',
    'notification_updated': 'Notification Updated',
    'notification_deleted': 'Notification Deleted',
    'activated': 'activated',
    'deactivated': 'deactivated',
    'position_top_right': 'Top Right',
    'position_top_left': 'Top Left',
    'position_top_center': 'Top Center',
    'position_center': 'Center',
    'position_bottom_right': 'Bottom Right',
    'position_bottom_left': 'Bottom Left',
    'position_bottom_center': 'Bottom Center',
    'position': 'Position',
    'duration': 'Duration',
    'minutes': 'minutes',

    // Break Timers
    'break_timer_management': 'Break Timer Management',
    'add_timer': 'Add Timer',
    'create_new_timer': 'Create New Break Timer',
    'timer_title': 'Timer Title',
    'timer_title_placeholder': 'Example: Break Timer',
    'start_time': 'Start Time',
    'end_time': 'End Time',
    'timer_position': 'Timer Position',
    'create_timer': 'Create Timer',
    'no_timers_yet': 'No timers yet',
    'no_timers_description': 'Start by creating a new break timer',
    'timer_created': 'Timer Created',
    'timer_created_description': 'Break timer created successfully',
    'timer_updated': 'Timer Updated',
    'timer_deleted': 'Timer Deleted',
    'timer_deleted_description': 'Timer deleted successfully',
    'start': 'Start',
    'end': 'End',

    // News Ticker
    'news_ticker_management': 'News Ticker Management',
    'add_news': 'Add News',
    'edit_news': 'Edit News',
    'add_new_news': 'Add New News',
    'news_title': 'News Title',
    'news_title_placeholder': 'Write news title',
    'news_content': 'News Content (optional)',
    'news_content_placeholder': 'Write news details',
    'display_order': 'Display Order',
    'update': 'Update',
    'saving': 'Saving...',
    'no_news_yet': 'No news yet',
    'news_updated': 'News updated successfully',
    'news_added': 'News added successfully',
    'news_deleted_title': 'News Deleted',
    'news_deleted_description': 'News deleted successfully',
    'news_status_updated': 'News status updated',
    'news_activated': 'News activated',
    'news_deactivated': 'News deactivated',
    'created_date': 'Created',

    // Slideshow
    'slideshow_management': 'Slideshows',
    'add_slideshow_btn': 'Add Slideshow',
    'refresh': 'Refresh',
    'current_system': 'Current System',
    'slideshow_system_note_1': 'Only one slideshow can be active at a time.',
    'slideshow_system_note_2': 'When activating a slideshow, any other active slideshow will be stopped automatically.',
    'slideshow_system_note_3': 'Each slideshow displays its images with a 15-second interval between each image.',
    'slideshow_system_note_4': 'Use the eye button to activate/deactivate any slideshow.',
    'no_slideshows_yet_new': 'No slideshows yet',
    'slideshow_added': 'Slideshow added successfully',
    'slideshow_activated_success': 'Slideshow activated successfully',
    'slideshow_deactivated_success': 'Slideshow deactivated',
    'slideshows_deleted': 'Slideshow deleted',
    'slideshows_deleted_description': 'Slideshow deleted successfully',
    'slideshow_preview_new': 'Slideshow Preview',
    'select_slideshow_to_preview': 'Select a slideshow to preview',
    'images_word': 'images',
    'seconds_per_image': 'seconds per image',
    'activate_slideshow': 'Activate Slideshow',
    'deactivate_slideshow': 'Deactivate Slideshow',
    'delete_slideshow': 'Delete Slideshow',

    // Subscription Request Page
    'back_to_home': 'Back to Home Page',
    'subscription_request_title': 'REMOTEWEB Subscription Request',
    'subscription_request_subtitle': 'Join TRNDSKY platform and start managing your screens and websites efficiently',
    'full_name': 'Full Name',
    'full_name_placeholder': 'Enter your full name',
    'email_placeholder': 'example@company.com',
    'phone_number': 'Contact Number',
    'phone_placeholder': '05xxxxxxxx',
    'company_name': 'Company Name',
    'company_name_placeholder': 'Enter your company name',
    'submit_request': 'Submit Subscription Request',
    'submitting': 'Submitting...',
    'name_min_error': 'Name must be at least 2 characters',
    'email_invalid_error': 'Invalid email format',
    'phone_min_error': 'Phone number must be at least 10 digits',
    'company_required_error': 'Company name is required',
    'request_success': 'Subscription request sent successfully! We will contact you soon.',
    'email_warning': 'Your request was registered successfully but email could not be sent',
    'request_error': 'An error occurred while sending the request. Please try again.'
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
