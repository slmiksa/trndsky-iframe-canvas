import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SuperAdminDashboard from './SuperAdminDashboard';
import ClientDashboard from './ClientDashboard';

const Dashboard = () => {
  const { user, userRole, loading, accountId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // For account users, redirect to their specific dashboard with account ID
    if (!loading && user && userRole === 'account_user' && accountId) {
      console.log('🔄 Redirecting account user to specific dashboard:', `/dashboard/${accountId}`);
      navigate(`/dashboard/${accountId}`, { replace: true });
    }
  }, [user, userRole, loading, accountId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (userRole === 'super_admin') {
    return <SuperAdminDashboard />;
  } else if (userRole === 'account_user' && accountId) {
    // This should not be reached due to the redirect above, but keeping as fallback
    return <ClientDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">مرحباً بك في النظام</h1>
        <p className="text-gray-600">لم يتم تعيين دور لحسابك بعد. يرجى التواصل مع المدير.</p>
      </div>
    </div>
  );
};

export default Dashboard;
