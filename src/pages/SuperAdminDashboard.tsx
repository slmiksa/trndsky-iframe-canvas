
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

interface Account {
  id: string;
  name: string;
  email: string;
  database_name: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
}

const SuperAdminDashboard = () => {
  const { signOut } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    password: '',
    database_name: '',
  });

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "خطأ في تحميل الحسابات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newAccount.email,
        password: newAccount.password,
        email_confirm: true,
      });

      if (error) throw error;

      const passwordHash = await hashPassword(newAccount.password);

      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          name: newAccount.name,
          email: newAccount.email,
          password_hash: passwordHash,
          database_name: newAccount.database_name,
          status: 'active',
        });

      if (accountError) throw accountError;

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `تم إنشاء حساب ${newAccount.name}`,
      });

      setNewAccount({ name: '', email: '', password: '', database_name: '' });
      setShowCreateForm(false);
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hashPassword = async (password: string) => {
    return btoa(password); // بسيط للتجربة - في الإنتاج استخدم bcrypt
  };

  const updateAccountStatus = async (accountId: string, status: 'active' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ status })
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "تم تحديث حالة الحساب",
        description: `تم ${status === 'active' ? 'تفعيل' : 'إيقاف'} الحساب`,
      });

      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الحساب",
        description: error.message,
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
              <Button onClick={() => setShowCreateForm(true)}>
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
                    <Label htmlFor="name">اسم الحساب</Label>
                    <Input
                      id="name"
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAccount.email}
                      onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                      required
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newAccount.password}
                      onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                      required
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="database_name">اسم قاعدة البيانات</Label>
                    <Input
                      id="database_name"
                      value={newAccount.database_name}
                      onChange={(e) => setNewAccount({...newAccount, database_name: e.target.value})}
                      required
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={loading}>
                    إنشاء الحساب
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{account.name}</h3>
                    <p className="text-sm text-gray-600">{account.email}</p>
                    <p className="text-sm text-gray-500">قاعدة البيانات: {account.database_name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(account.status)}
                    <div className="flex gap-2">
                      {account.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateAccountStatus(account.id, 'suspended')}
                        >
                          إيقاف
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => updateAccountStatus(account.id, 'active')}
                        >
                          تفعيل
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
