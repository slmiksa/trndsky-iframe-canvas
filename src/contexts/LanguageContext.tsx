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
    'current_branch': 'الفرع الحالي',
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
    
    // Branches
    'branches_management': 'إدارة الفروع',
    'add_branch': 'إضافة فرع',
    'add_new_branch': 'إضافة فرع جديد',
    'branch_name': 'اسم الفرع',
    'enter_branch_name': 'أدخل اسم الفرع',
    'branch_path': 'مسار الفرع',
    'main_account': 'الحساب الرئيسي',
    'controls_all_branches': 'يتحكم في جميع الفروع',
    'selected': 'محدد',
    'select': 'تحديد',
    'selected_branch': 'الفرع المحدد',
    'branch_selected': 'تم تحديد الفرع',
    'main_account_selected': 'تم تحديد الحساب الرئيسي',
    'inactive': 'غير نشط',
    'deactivate': 'إلغاء التفعيل',
    'activate': 'تفعيل',
    'edit_branch': 'تعديل الفرع',
    'update_branch': 'تحديث الفرع',
    'delete_branch': 'حذف الفرع',
    'are_you_sure_delete_branch': 'هل أنت متأكد من حذف هذا الفرع؟',
    'branch_added_successfully': 'تم إضافة الفرع بنجاح',
    'branch_updated_successfully': 'تم تحديث الفرع بنجاح',
    'branch_deleted_successfully': 'تم حذف الفرع بنجاح',
    'branch_status_updated': 'تم تحديث حالة الفرع',
    'failed_to_add_branch': 'فشل في إضافة الفرع',
    'failed_to_update_branch': 'فشل في تحديث الفرع',
    'failed_to_delete_branch': 'فشل في حذف الفرع',
    'failed_to_update_branch_status': 'فشل في تحديث حالة الفرع',
    'please_fill_all_fields': 'يرجى ملء جميع الحقول',
    'success': 'نجح',
    
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
    'english': 'English',
    
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
    'current_branch': 'Current Branch',
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
    
    // Branches
    'branches_management': 'Branches Management',
    'add_branch': 'Add Branch',
    'add_new_branch': 'Add New Branch',
    'branch_name': 'Branch Name',
    'enter_branch_name': 'Enter branch name',
    'branch_path': 'Branch Path',
    'main_account': 'Main Account',
    'controls_all_branches': 'Controls all branches',
    'selected': 'Selected',
    'select': 'Select',
    'selected_branch': 'Selected Branch',
    'branch_selected': 'Branch selected',
    'main_account_selected': 'Main account selected',
    'inactive': 'Inactive',
    'deactivate': 'Deactivate',
    'activate': 'Activate',
    'edit_branch': 'Edit Branch',
    'update_branch': 'Update Branch',
    'delete_branch': 'Delete Branch',
    'are_you_sure_delete_branch': 'Are you sure you want to delete this branch?',
    'branch_added_successfully': 'Branch added successfully',
    'branch_updated_successfully': 'Branch updated successfully',
    'branch_deleted_successfully': 'Branch deleted successfully',
    'branch_status_updated': 'Branch status updated',
    'failed_to_add_branch': 'Failed to add branch',
    'failed_to_update_branch': 'Failed to update branch',
    'failed_to_delete_branch': 'Failed to delete branch',
    'failed_to_update_branch_status': 'Failed to update branch status',
    'please_fill_all_fields': 'Please fill all fields',
    'success': 'Success',
    
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
    'english': 'English',
    
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
