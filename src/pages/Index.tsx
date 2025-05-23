
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <h1 className="text-8xl md:text-9xl font-bold text-white tracking-wider mb-8 animate-pulse">
          TRNDSKY
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full opacity-80 mb-8"></div>
        <div className="space-y-4">
          <p className="text-white text-xl mb-8">منصة إدارة المواقع الإلكترونية</p>
          <Link to="/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
              دخول النظام
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
