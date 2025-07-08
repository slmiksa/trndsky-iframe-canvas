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
    understood: 'فهمت'
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
    understood: 'Got it'
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