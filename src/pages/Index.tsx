import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MobileDownloadButtons from '@/components/MobileDownloadButtons';
const Index = () => {
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 p-4">
      <div className="text-center max-w-lg mx-auto">
        <div className="flex justify-center mb-6">
          <img src="/lovable-uploads/e3d01953-fe35-45d7-ac2b-e50bac917958.png" alt="TRNDSKY Logo" className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain" />
        </div>
        
        
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-wider mb-6 opacity-90">WELCOME</h2>
        
        <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full opacity-80 mb-6 py-[13px]"></div>
        
        <p className="text-white text-lg sm:text-xl mb-8 font-medium">منصة إدارة  وتوحيد الشاشات والمواقع</p>
        
        {/* قسم مزايا النظام */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6 text-center">النظام يمكنك من</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">نقل موقع إلكتروني</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">إشعارات نصية وصور</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">شريط أخبار متحرك</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">سلايدات للمتاجر والشركات</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">مؤقتات تنازلية لأي غرض</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0"></div>
              <span className="text-sm sm:text-base">التحكم بعدد شاشات غير محدود</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Link to="/login" className="block">
            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
              دخول النظام
            </Button>
          </Link>
          
          <Link to="/subscription-request" className="block">
            <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
              الإشتراك في النظام
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 text-white text-base font-medium">
          <p>منصة موثوقة لخلق بيئة عمل ممتازة</p>
        </div>

        <div className="mt-8">
          <p className="text-white text-lg font-medium mb-4">تحميل التطبيق</p>
          <MobileDownloadButtons />
        </div>
      </div>
    </div>;
};
export default Index;