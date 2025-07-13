
import { useState, useCallback } from 'react';

export type Language = 'ar' | 'en';

interface Translations {
  welcome: string;
  systemDescription: string;
  systemFeatures: string;
  websiteTransfer: string;
  notifications: string;
  newsTicker: string;
  slideshows: string;
  countdownTimers: string;
  unlimitedScreens: string;
  loginSystem: string;
  subscribeAndTry: string;
  reliablePlatform: string;
  downloadApp: string;
  downloadButtonText: string;
  addToHomeScreen: string;
  addToHomeScreenInstructions: string;
  understood: string;
  
  // Common
  loading: string;
  error: string;
  success: string;
  cancel: string;
  delete: string;
  edit: string;
  save: string;
  select: string;
  activate: string;
  deactivate: string;
  active: string;
  inactive: string;
  
  // Mobile download buttons
  apple_android: string;
  download_our_app: string;
  scan_qr_code: string;
  or_search_app_store: string;
  
  // Branches
  branches_management: string;
  add_branch: string;
  add_new_branch: string;
  branch_name: string;
  branch_path: string;
  enter_branch_name: string;
  edit_branch: string;
  update_branch: string;
  delete_branch: string;
  are_you_sure_delete_branch: string;
  branch_added_successfully: string;
  branch_updated_successfully: string;
  branch_deleted_successfully: string;
  branch_status_updated: string;
  failed_to_load_branches: string;
  failed_to_add_branch: string;
  failed_to_update_branch: string;
  failed_to_delete_branch: string;
  failed_to_update_branch_status: string;
  main_account: string;
  controls_all_branches: string;
  please_fill_all_fields: string;
  
  // Dashboard
  dashboard_title: string;
  subscription_expired: string;
  expiring_soon: string;
  subscription_active: string;
  subscription_inactive: string;
  expires_on: string;
  view_public_page: string;
  
  // Content Types
  videos: string;
  websites: string;
  news: string;
  timers: string;
}

const translations: Record<Language, Translations> = {
  ar: {
    welcome: 'أهلاً وسهلاً',
    systemDescription: 'منصة إدارة وتوحيد الشاشات والمواقع',
    systemFeatures: 'النظام يمكنك من',
    websiteTransfer: 'نقل موقع إلكتروني',
    notifications: 'إشعارات نصية وصور',
    newsTicker: 'شريط أخبار متحرك',
    slideshows: 'سلايدات للمتاجر والشركات',
    countdownTimers: 'مؤقتات تنازلية لأي غرض',
    unlimitedScreens: 'التحكم بعدد شاشات غير محدود',
    loginSystem: 'دخول النظام',
    subscribeAndTry: 'للاشتراك والتجربة',
    reliablePlatform: 'منصة موثوقة لخلق بيئة عمل ممتازة',
    downloadApp: 'تحميل التطبيق',
    downloadButtonText: 'آيل / أندرويد',
    addToHomeScreen: 'إضافة إلى الشاشة الرئيسية',
    addToHomeScreenInstructions: 'لإضافة هذا الموقع إلى شاشتك الرئيسية كتطبيق، اتبع الخطوات الخاصة بمتصفحك. على أجهزة آيفون، اضغط على زر المشاركة ثم \'إضافة إلى الشاشة الرئيسية\'. على أجهزة أندرويد، اضغط على قائمة الخيارات (ثلاث نقاط) ثم \'تثبيت التطبيق\' أو \'إضافة إلى الشاشة الرئيسية\'.',
    understood: 'فهمت',
    
    // Common
    loading: 'جاري التحميل',
    error: 'خطأ',
    success: 'نجح',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    save: 'حفظ',
    select: 'اختيار',
    activate: 'تفعيل',
    deactivate: 'إلغاء تفعيل',
    active: 'نشط',
    inactive: 'غير نشط',
    
    // Mobile download buttons
    apple_android: 'أبل / أندرويد',
    download_our_app: 'حمل تطبيقنا',
    scan_qr_code: 'امسح رمز الاستجابة السريعة لتحميل تطبيقنا',
    or_search_app_store: 'أو ابحث عن تطبيقنا في متجر التطبيقات أو جوجل بلاي',
    
    // Branches
    branches_management: 'إدارة الفروع',
    add_branch: 'إضافة فرع',
    add_new_branch: 'إضافة فرع جديد',
    branch_name: 'اسم الفرع',
    branch_path: 'مسار الفرع',
    enter_branch_name: 'أدخل اسم الفرع',
    edit_branch: 'تعديل الفرع',
    update_branch: 'تحديث الفرع',
    delete_branch: 'حذف الفرع',
    are_you_sure_delete_branch: 'هل أنت متأكد من حذف هذا الفرع؟',
    branch_added_successfully: 'تم إضافة الفرع بنجاح',
    branch_updated_successfully: 'تم تحديث الفرع بنجاح',
    branch_deleted_successfully: 'تم حذف الفرع بنجاح',
    branch_status_updated: 'تم تحديث حالة الفرع',
    failed_to_load_branches: 'فشل في تحميل الفروع',
    failed_to_add_branch: 'فشل في إضافة الفرع',
    failed_to_update_branch: 'فشل في تحديث الفرع',
    failed_to_delete_branch: 'فشل في حذف الفرع',
    failed_to_update_branch_status: 'فشل في تحديث حالة الفرع',
    main_account: 'الحساب الرئيسي',
    controls_all_branches: 'يتحكم بجميع الفروع',
    please_fill_all_fields: 'الرجاء ملء جميع الحقول',
    
    // Dashboard
    dashboard_title: 'لوحة التحكم',
    subscription_expired: 'انتهت صلاحية الاشتراك',
    expiring_soon: 'ينتهي قريباً',
    subscription_active: 'اشتراك نشط',
    subscription_inactive: 'اشتراك غير نشط',
    expires_on: 'ينتهي في',
    view_public_page: 'عرض الصفحة العامة',
    
    // Content Types
    videos: 'الفيديوهات',
    websites: 'المواقع',
    news: 'الأخبار',
    timers: 'المؤقتات',
  },
  en: {
    welcome: 'WELCOME',
    systemDescription: 'Screen and Website Management Platform',
    systemFeatures: 'The system enables you to',
    websiteTransfer: 'Transfer websites',
    notifications: 'Text and image notifications',
    newsTicker: 'Moving news ticker',
    slideshows: 'Slideshows for stores and companies',
    countdownTimers: 'Countdown timers for any purpose',
    unlimitedScreens: 'Control unlimited screens',
    loginSystem: 'Login System',
    subscribeAndTry: 'Subscribe & Try',
    reliablePlatform: 'Reliable platform for creating an excellent work environment',
    downloadApp: 'Download App',
    downloadButtonText: 'Apple / Android',
    addToHomeScreen: 'Add to Home Screen',
    addToHomeScreenInstructions: 'To add this website to your home screen as an app, follow the steps for your browser. On iPhone, tap the share button then \'Add to Home Screen\'. On Android, tap the options menu (three dots) then \'Install app\' or \'Add to Home Screen\'.',
    understood: 'Got it',
    
    // Common
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    select: 'Select',
    activate: 'Activate',
    deactivate: 'Deactivate',
    active: 'Active',
    inactive: 'Inactive',
    
    // Mobile download buttons
    apple_android: 'Apple / Android',
    download_our_app: 'Download our app',
    scan_qr_code: 'Scan the QR code to download our app',
    or_search_app_store: 'Or search for our app in the App Store or Google Play Store',
    
    // Branches
    branches_management: 'Branches Management',
    add_branch: 'Add Branch',
    add_new_branch: 'Add New Branch',
    branch_name: 'Branch Name',
    branch_path: 'Branch Path',
    enter_branch_name: 'Enter branch name',
    edit_branch: 'Edit Branch',
    update_branch: 'Update Branch',
    delete_branch: 'Delete Branch',
    are_you_sure_delete_branch: 'Are you sure you want to delete this branch?',
    branch_added_successfully: 'Branch added successfully',
    branch_updated_successfully: 'Branch updated successfully',
    branch_deleted_successfully: 'Branch deleted successfully',
    branch_status_updated: 'Branch status updated',
    failed_to_load_branches: 'Failed to load branches',
    failed_to_add_branch: 'Failed to add branch',
    failed_to_update_branch: 'Failed to update branch',
    failed_to_delete_branch: 'Failed to delete branch',
    failed_to_update_branch_status: 'Failed to update branch status',
    main_account: 'Main Account',
    controls_all_branches: 'Controls all branches',
    please_fill_all_fields: 'Please fill all fields',
    
    // Dashboard
    dashboard_title: 'Dashboard',
    subscription_expired: 'Subscription Expired',
    expiring_soon: 'Expiring Soon',
    subscription_active: 'Subscription Active',
    subscription_inactive: 'Subscription Inactive',
    expires_on: 'Expires on',
    view_public_page: 'View Public Page',
    
    // Content Types
    videos: 'Videos',
    websites: 'Websites',
    news: 'News',
    timers: 'Timers',
  }
};

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>('ar');

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  const t = useCallback((key: keyof Translations) => {
    return translations[language][key];
  }, [language]);

  return {
    language,
    toggleLanguage,
    t,
    isRTL: language === 'ar'
  };
};
