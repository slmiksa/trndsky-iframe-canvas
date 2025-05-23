
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
    // This function will be used later if we need to update roles
  };

  useEffect(() => {
    // Check for saved session
    const savedSession = localStorage.getItem('auth_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        console.log('🔐 Found saved session:', parsedSession);
        setUser(parsedSession.user);
        setSession(parsedSession);
        setUserRole(parsedSession.role);
        setAccountId(parsedSession.account_id);
        console.log('✅ Session restored successfully');
      } catch (error) {
        console.error('❌ Error parsing saved session:', error);
        localStorage.removeItem('auth_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Starting authentication for:', username);
      
      const authResult = await authenticateUser({ username, password });
      console.log('✅ Authentication successful:', authResult);
      
      let userData: User;
      
      if (authResult.role === 'super_admin') {
        const superAdmin = authResult.user as any;
        userData = {
          id: superAdmin.id,
          username: superAdmin.username,
          role: authResult.role
        };
      } else {
        const account = authResult.user as any;
        userData = {
          id: account.id,
          name: account.name,
          email: account.email,
          role: authResult.role
        };
      }

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

      localStorage.setItem('auth_session', JSON.stringify(sessionData));
      console.log('💾 Session saved to localStorage');

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في النظام",
      });
    } catch (error: any) {
      console.error('❌ Authentication failed:', error);
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
      console.log('🚪 Signing out user');
      setUser(null);
      setSession(null);
      setUserRole(null);
      setAccountId(null);
      
      localStorage.removeItem('auth_session');
      console.log('✅ User signed out successfully');
      
      toast({
        title: "تم تسجيل الخروج",
        description: "شكراً لاستخدام النظام",
      });
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
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
