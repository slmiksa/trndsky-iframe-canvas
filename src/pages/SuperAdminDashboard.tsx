
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Users, Globe, Settings, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { hashPassword } from '@/utils/authUtils';
import NotificationManager from '@/components/NotificationManager';
import BreakTimerManager from '@/components/BreakTimerManager';

interface Account {
  id: string;
  name: string;
  email: string;
  database_name: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  activation_start_date: string | null;
  activation_end_date: string | null;
  is_subscription_active: boolean | null;
}

const SuperAdminDashboard = () => {
  const { signOut, userRole } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'notifications' | 'timers'>('accounts');
  const [editingActivation, setEditingActivation] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    password: '',
    database_name: '',
    activation_start_date: '',
    activation_end_date: '',
  });

  // Redirect if not super admin
  useEffect(() => {
    if (userRole && userRole !== 'super_admin') {
      window.location.href = '/login';
    }
  }, [userRole]);

  // Check if account subscription is expired
  const isSubscriptionExpired = (account: Account) => {
    if (!account.activation_end_date) return false;
    return new Date(account.activation_end_date) < new Date();
  };

  // Check if subscription is expiring soon (within 7 days)
  const isSubscriptionExpiringSoon = (account: Account) => {
    if (!account.activation_end_date) return false;
    const endDate = new Date(account.activation_end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const fetchAccounts = async () => {
    try {
      console.log('🔍 جاري تحميل الحسابات...');
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ في تحميل الحسابات:', error);
        throw error;
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
      const passwordHash = await hashPassword(newAccount.password);
      
      const accountData = {
        name: newAccount.name,
        email: newAccount.email,
        password_hash: passwordHash,
        database_name: newAccount.database_name,
        status: 'active' as const,
        activation_start_date: newAccount.activation_start_date || null,
        activation_end_date: newAccount.activation_end_date || null,
        is_subscription_active: true
      };

      const { data: createdAccount, error: accountError } = await supabase
        .from('accounts')
        .insert(accountData)
        .select()
        .single();

      if (accountError) {
        console.error('❌ خطأ في إنشاء الحساب:', accountError);
        throw accountError;
      }

      console.log('✅ تم إنشاء الحساب بنجاح:', createdAccount);

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `تم إنشاء حساب ${newAccount.name}`,
      });

      setNewAccount({ 
        name: '', 
        email: '', 
        password: '', 
        database_name: '',
        activation_start_date: '',
        activation_end_date: ''
      });
      setShowCreateForm(false);
      
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

  const updateAccountActivation = async (accountId: string, startDate: string, endDate: string) => {
    try {
      console.log(`🔄 جاري تحديث فترة التنشيط للحساب ${accountId}`);
      
      const { error } = await supabase
        .from('accounts')
        .update({ 
          activation_start_date: startDate || null,
          activation_end_date: endDate || null,
          is_subscription_active: true
        })
        .eq('id', accountId);

      if (error) {
        console.error('❌ خطأ في تحديث فترة التنشيط:', error);
        throw error;
      }

      console.log('✅ تم تحديث فترة التنشيط بنجاح');
      
      toast({
        title: "تم تحديث فترة التنشيط",
        description: "تم تحديث فترة التنشيط بنجاح",
      });

      setEditingActivation(null);
      await fetchAccounts();
    } catch (error: any) {
      console.error('❌ خطأ في تحديث فترة التنشيط:', error);
      toast({
        title: "خطأ في تحديث فترة التنشيط",
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    }
  };

  const updateAccountStatus = async (accountId: string, status: 'active' | 'suspended') => {
    try {
      console.log(`🔄 جاري تحديث حالة الحساب ${accountId} إلى ${status}`);
      
      const { error } = await supabase
        .from('accounts')
        .update({ status })
        .eq('id', accountId);

      if (error) {
        console.error('❌ خطأ في تحديث حالة الحساب:', error);
        throw error;
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

  const getSubscriptionBadge = (account: Account) => {
    if (isSubscriptionExpired(account)) {
      return <Badge variant="destructive">منتهي الصلاحية</Badge>;
    }
    if (isSubscriptionExpiringSoon(account)) {
      return <Badge variant="secondary">ينتهي قريباً</Badge>;
    }
    if (account.activation_end_date) {
      return <Badge variant="default">نشط</Badge>;
    }
    return <Badge variant="outline">غير محدد</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA');
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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    {accounts.filter(acc => acc.status === 'active' && !isSubscriptionExpired(acc)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">منتهية الصلاحية</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {accounts.filter(isSubscriptionExpired).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">تنتهي قريباً</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {accounts.filter(isSubscriptionExpiringSoon).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'accounts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              الحسابات
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              الإشعارات
            </button>
            <button
              onClick={() => setActiveTab('timers')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'timers'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              المؤقتات
            </button>
          </div>
        </div>

        {/* Account Selector for Notifications and Timers */}
        {(activeTab === 'notifications' || activeTab === 'timers') && (
          <div className="mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="account-select" className="text-sm font-medium">
                    اختر الحساب:
                  </Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="اختر حساب..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'accounts' && (
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
                    <div>
                      <Label htmlFor="activation_start_date">تاريخ بداية التنشيط</Label>
                      <Input
                        id="activation_start_date"
                        type="date"
                        value={newAccount.activation_start_date}
                        onChange={(e) => setNewAccount({...newAccount, activation_start_date: e.target.value})}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label htmlFor="activation_end_date">تاريخ انتهاء التنشيط</Label>
                      <Input
                        id="activation_end_date"
                        type="date"
                        value={newAccount.activation_end_date}
                        onChange={(e) => setNewAccount({...newAccount, activation_end_date: e.target.value})}
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
                    <div key={account.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{account.name}</h3>
                            {getStatusBadge(account.status)}
                            {getSubscriptionBadge(account)}
                            {isSubscriptionExpired(account) && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{account.email}</p>
                          <p className="text-sm text-gray-500">قاعدة البيانات: {account.database_name}</p>
                          <div className="text-xs text-gray-400 mt-1">
                            <p>تاريخ الإنشاء: {new Date(account.created_at).toLocaleDateString('ar-SA')}</p>
                            <p>بداية التنشيط: {formatDate(account.activation_start_date)}</p>
                            <p>انتهاء التنشيط: {formatDate(account.activation_end_date)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingActivation(account.id)}
                              disabled={loading}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              إدارة التنشيط
                            </Button>
                          </div>
                        </div>
                      </div>

                      {editingActivation === account.id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded border">
                          <h4 className="font-medium mb-3">تحديث فترة التنشيط</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`start-${account.id}`}>تاريخ البداية</Label>
                              <Input
                                id={`start-${account.id}`}
                                type="date"
                                defaultValue={account.activation_start_date ? account.activation_start_date.split('T')[0] : ''}
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`end-${account.id}`}>تاريخ الانتهاء</Label>
                              <Input
                                id={`end-${account.id}`}
                                type="date"
                                defaultValue={account.activation_end_date ? account.activation_end_date.split('T')[0] : ''}
                                dir="ltr"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => {
                                const startInput = document.getElementById(`start-${account.id}`) as HTMLInputElement;
                                const endInput = document.getElementById(`end-${account.id}`) as HTMLInputElement;
                                updateAccountActivation(account.id, startInput.value, endInput.value);
                              }}
                            >
                              حفظ
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingActivation(null)}
                            >
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && selectedAccount && (
          <NotificationManager accountId={selectedAccount} />
        )}

        {activeTab === 'notifications' && !selectedAccount && (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">يرجى اختيار حساب لإدارة الإشعارات</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'timers' && selectedAccount && (
          <BreakTimerManager accountId={selectedAccount} />
        )}

        {activeTab === 'timers' && !selectedAccount && (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">يرجى اختيار حساب لإدارة المؤقتات</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
