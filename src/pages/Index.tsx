import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import MobileDownloadButtons from '@/components/MobileDownloadButtons';
import AnimatedBackground from '@/components/AnimatedBackground';
import Footer from '@/components/Footer';
import { useLanguage } from '@/hooks/useLanguage';

const Index = () => {
  const { language, toggleLanguage, t, isRTL } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* الخلفية المتحركة */}
      <AnimatedBackground />
      
      {/* زر تغيير اللغة */}
      <Button
        onClick={toggleLanguage}
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <Globe className="w-4 h-4 mr-2" />
        {language === 'ar' ? 'EN' : 'عربي'}
      </Button>

      <div className="text-center max-w-lg mx-auto relative z-10">
        <div className="flex justify-center mb-3">
          <img src="/lovable-uploads/e3d01953-fe35-45d7-ac2b-e50bac917958.png" alt="REMOTEWEB Logo" className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 object-contain" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-wider mb-6 opacity-90">
          {t('welcome')}
        </h2>
        
        <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full opacity-80 mb-6 py-[13px]"></div>
        
        <p className="text-white text-lg sm:text-xl mb-8 font-medium">
          {t('systemDescription')}
        </p>
        
        {/* قسم مزايا النظام */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            {t('systemFeatures')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white">
            <div className={`flex items-center space-x-3 ${isRTL ? 'rtl:space-x-reverse' : ''}`}>
              <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">{t('websiteTransfer')}</span>
            </div>
            <div className={`flex items-center space-x-3 ${isRTL ? 'rtl:space-x-reverse' : ''}`}>
              <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">{t('notifications')}</span>
            </div>
            <div className={`flex items-center space-x-3 ${isRTL ? 'rtl:space-x-reverse' : ''}`}>
              <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">{t('newsTicker')}</span>
            </div>
            <div className={`flex items-center space-x-3 ${isRTL ? 'rtl:space-x-reverse' : ''}`}>
              <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">{t('slideshows')}</span>
            </div>
            <div className={`flex items-center space-x-3 ${isRTL ? 'rtl:space-x-reverse' : ''}`}>
              <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">{t('countdownTimers')}</span>
            </div>
            <div className={`flex items-center space-x-3 ${isRTL ? 'rtl:space-x-reverse' : ''}`}>
              <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">{t('unlimitedScreens')}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Link to="/login" className="block">
            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
              {t('loginSystem')}
            </Button>
          </Link>
          
          <Link to="/subscription-request" className="block">
            <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
              {t('subscribeAndTry')}
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 text-white text-base font-medium">
          <p>{t('reliablePlatform')}</p>
        </div>

        <div className="mt-8">
          <p className="text-white text-lg font-medium mb-4">{t('downloadApp')}</p>
          <MobileDownloadButtons />
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Index;