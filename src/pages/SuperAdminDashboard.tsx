
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Users, Globe, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { hashPassword } from '@/utils/authUtils';

interface Account {
  id: string;
  name: string;
  email: string;
  database_name: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
}

const SuperAdminDashboard = () => {
  const { signOut, userRole } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    password: '',
    database_name: '',
  });

  // Redirect if not super admin
  useEffect(() => {
    if (userRole && userRole !== 'super_admin') {
      window.location.href = '/login';
    }
  }, [userRole]);

  const fetchAccounts = async () => {
    try {
      console.log('🔍 جاري تحميل الحسابات...');
      
      // Use RPC call to bypass RLS for super admin
      const { data, error } = await supabase.rpc('get_all_accounts_for_super_admin');

      if (error) {
        console.error('❌ خطأ في تحميل الحسابات:', error);
        
        // Fallback to direct table access if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('accounts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          throw fallbackError;
        }
        
        console.log('✅ تم تحميل الحسابات بنجاح (fallback):', fallbackData);
        setAccounts(fallbackData || []);
        return;
      }
      
      console.log('✅ تم تحميل الحسابات بنجاح:', data);
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "خطأ في تحميل الحسابات",
        description: "سيتم المحاولة مرة أخرى...",
        variant: "destructive",
      });
      
      // Set empty array to prevent infinite loading
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'super_admin') {
      fetchAccounts();
    }
  }, [userRole]);

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 بداية إنشاء حساب جديد:', newAccount);
    
    if (!newAccount.name || !newAccount.email || !newAccount.password || !newAccount.database_name) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // تشفير كلمة المرور
      console.log('🔐 جاري تشفير كلمة المرور...');
      const passwordHash = await hashPassword(newAccount.password);
      console.log('✅ تم تشفير كلمة المرور بنجاح');

      // Use RPC call to create account as super admin
      console.log('💾 جاري إدراج الحساب في قاعدة البيانات...');
      const { data: accountData, error: accountError } = await supabase.rpc('create_account_as_super_admin', {
        account_name: newAccount.name,
        account_email: newAccount.email,
        account_password_hash: passwordHash,
        account_database_name: newAccount.database_name
      });

      if (accountError) {
        console.error('❌ خطأ في إنشاء الحساب (RPC):', accountError);
        
        // Fallback to direct insert if RPC doesn't work
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('accounts')
          .insert({
            name: newAccount.name,
            email: newAccount.email,
            password_hash: passwordHash,
            database_name: newAccount.database_name,
            status: 'active',
          })
          .select()
          .single();

        if (fallbackError) {
          console.error('❌ خطأ في إنشاء الحساب (fallback):', fallbackError);
          throw fallbackError;
        }

        console.log('✅ تم إنشاء الحساب بنجاح (fallback):', fallbackData);
      } else {
        console.log('✅ تم إنشاء الحساب بنجاح (RPC):', accountData);
      }

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `تم إنشاء حساب ${newAccount.name}`,
      });

      // إعادة تعيين النموذج
      setNewAccount({ name: '', email: '', password: '', database_name: '' });
      setShowCreateForm(false);
      
      // تحديث قائمة الحسابات
      await fetchAccounts();
      
    } catch (error: any) {
      console.error('❌ خطأ في إنشاء الحساب:', error);
      
      let errorMessage = 'حدث خطأ غير متوقع';
      if (error.message) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'البريد الإلكتروني مستخدم مسبقاً';
        } else if (error.message.includes('invalid')) {
          errorMessage = 'البيانات المدخلة غير صحيحة';
        } else if (error.message.includes('policy')) {
          errorMessage = 'خطأ في صلاحيات قاعدة البيانات';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "خطأ في إنشاء الحساب",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAccountStatus = async (accountId: string, status: 'active' | 'suspended') => {
    try {
      console.log(`🔄 جاري تحديث حالة الحساب ${accountId} إلى ${status}`);
      
      // Use RPC call for updating as super admin
      const { error } = await supabase.rpc('update_account_status_as_super_admin', {
        account_id: accountId,
        new_status: status
      });

      if (error) {
        console.error('❌ خطأ في تحديث حالة الحساب (RPC):', error);
        
        // Fallback to direct update
        const { error: fallbackError } = await supabase
          .from('accounts')
          .update({ status })
          .eq('id', accountId);

        if (fallbackError) {
          console.error('❌ خطأ في تحديث حالة الحساب (fallback):', fallbackError);
          throw fallbackError;
        }
      }

      console.log('✅ تم تحديث حالة الحساب بنجاح');
      
      toast({
        title: "تم تحديث حالة الحساب",
        description: `تم ${status === 'active' ? 'تفعيل' : 'إيقاف'} الحساب`,
      });

      await fetchAccounts();
    } catch (error: any) {
      console.error('❌ خطأ في تحديث الحساب:', error);
      toast({
        title: "خطأ في تحديث الحساب",
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', variant: 'default' as const },
      suspended: { label: 'معلق', variant: 'destructive' as const },
      pending: { label: 'معلق', variant: 'secondary' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Show loading while checking user role
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized if not super admin
  if (userRole !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">غير مصرح</h1>
          <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم المدير العام</h1>
            <Button onClick={signOut} variant="outline">
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي الحسابات</p>
                  <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">الحسابات النشطة</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {accounts.filter(acc => acc.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">الحسابات المعلقة</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {accounts.filter(acc => acc.status === 'suspended').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>إدارة الحسابات</CardTitle>
              <Button onClick={() => setShowCreateForm(true)} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                إنشاء حساب جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showCreateForm && (
              <form onSubmit={createAccount} className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">اسم الحساب *</Label>
                    <Input
                      id="name"
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                      required
                      placeholder="أدخل اسم الحساب"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAccount.email}
                      onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                      required
                      placeholder="example@domain.com"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">كلمة المرور *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newAccount.password}
                      onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                      required
                      placeholder="أدخل كلمة مرور قوية"
                      dir="ltr"
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="database_name">اسم قاعدة البيانات *</Label>
                    <Input
                      id="database_name"
                      value={newAccount.database_name}
                      onChange={(e) => setNewAccount({...newAccount, database_name: e.target.value})}
                      required
                      placeholder="database_name"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={loading}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {loading && accounts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">جاري التحميل...</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">لا توجد حسابات بعد</p>
                  <p className="text-sm text-gray-500">ابدأ بإنشاء حساب جديد</p>
                </div>
              ) : (
                accounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{account.name}</h3>
                      <p className="text-sm text-gray-600">{account.email}</p>
                      <p className="text-sm text-gray-500">قاعدة البيانات: {account.database_name}</p>
                      <p className="text-xs text-gray-400">
                        تاريخ الإنشاء: {new Date(account.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(account.status)}
                      <div className="flex gap-2">
                        {account.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateAccountStatus(account.id, 'suspended')}
                            disabled={loading}
                          >
                            إيقاف
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => updateAccountStatus(account.id, 'active')}
                            disabled={loading}
                          >
                            تفعيل
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
