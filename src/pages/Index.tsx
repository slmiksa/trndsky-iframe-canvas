
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const handleSubscribeClick = () => {
    window.open('https://trndsky.com/software', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 p-4">
      <div className="text-center max-w-lg mx-auto">
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4">
            <div className="w-20 h-20 mx-auto bg-white rounded-xl flex items-center justify-center mb-2">
              <div className="text-purple-600 text-2xl font-bold">🌐</div>
            </div>
            <div className="text-white text-sm font-medium">REMOTEWEB</div>
          </div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-wider mb-6 animate-pulse">
          TRNDSKY
        </h1>
        
        <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full opacity-80 mb-6"></div>
        
        <p className="text-white text-lg sm:text-xl mb-8 font-medium">
          منصة إدارة المواقع الإلكترونية
        </p>
        
        <div className="space-y-3">
          <Link to="/login" className="block">
            <Button 
              size="lg" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              دخول النظام
            </Button>
          </Link>
          
          <Button 
            size="lg" 
            onClick={handleSubscribeClick}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            الإشتراك في النظام
          </Button>
        </div>
        
        <div className="mt-8 text-white/70 text-sm">
          <p>منصة موثوقة لإدارة مواقعك بسهولة</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
