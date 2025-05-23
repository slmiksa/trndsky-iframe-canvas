
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authenticateUser, LoginCredentials } from '@/utils/authUtils';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  username?: string;
  name?: string;
  email?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  userRole: string | null;
  accountId: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  const checkUserRole = async () => {
    // هذه الدالة ستستخدم لاحقاً إذا احتجنا لتحديث الأدوار
  };

  useEffect(() => {
    // التحقق من وجود جلسة محفوظة
    const savedSession = localStorage.getItem('auth_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setUser(parsedSession.user);
        setSession(parsedSession);
        setUserRole(parsedSession.role);
        setAccountId(parsedSession.account_id);
      } catch (error) {
        localStorage.removeItem('auth_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);
      const authResult = await authenticateUser({ username, password });
      
      const userData: User = {
        id: authResult.user.id,
        username: authResult.user.username || authResult.user.email,
        name: authResult.user.name,
        email: authResult.user.email,
        role: authResult.role
      };

      const sessionData = {
        user: userData,
        role: authResult.role,
        account_id: authResult.account_id,
        timestamp: Date.now()
      };

      setUser(userData);
      setSession(sessionData);
      setUserRole(authResult.role);
      setAccountId(authResult.account_id);

      // حفظ الجلسة في localStorage
      localStorage.setItem('auth_session', JSON.stringify(sessionData));

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في النظام",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
      setUserRole(null);
      setAccountId(null);
      
      localStorage.removeItem('auth_session');
      
      toast({
        title: "تم تسجيل الخروج",
        description: "شكراً لاستخدام النظام",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    accountId,
    signIn,
    signOut,
    checkUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
