
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const handleSubscribeClick = () => {
    window.open('https://trndsky.com/software', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="/lovable-uploads/e3d01953-fe35-45d7-ac2b-e50bac917958.png" 
            alt="TRNDSKY Logo" 
            className="w-56 h-56 object-contain"
          />
        </div>
        <h1 className="text-8xl md:text-9xl font-bold text-white tracking-wider mb-8 animate-pulse">
          TRNDSKY
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full opacity-80 mb-8"></div>
        <div className="space-y-4">
          <p className="text-white text-xl mb-8">منصة إدارة المواقع الإلكترونية</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                دخول النظام
              </Button>
            </Link>
            <Button 
              size="lg" 
              onClick={handleSubscribeClick}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
            >
              الإشتراك في النظام
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
