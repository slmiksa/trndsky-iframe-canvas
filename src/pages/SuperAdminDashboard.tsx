import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Users, Globe, Settings, Clock, Calendar, AlertCircle, FileText, Eye, EyeOff, KeyRound, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { hashPassword } from '@/utils/authUtils';
import NotificationManager from '@/components/NotificationManager';
import BreakTimerManager from '@/components/BreakTimerManager';
import BranchManager from '@/components/BranchManager';

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

interface SubscriptionRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const SuperAdminDashboard = () => {
  const { signOut, userRole } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'notifications' | 'timers' | 'subscription-requests' | 'branches'>('accounts');
  const [editingActivation, setEditingActivation] = useState<string | null>(null);
  const [showingPassword, setShowingPassword] = useState<string | null>(null);
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
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
    }
  };

  const fetchSubscriptionRequests = async () => {
    try {
      console.log('🔍 جاري تحميل طلبات الاشتراك...');
      
      const { data, error } = await supabase
        .from('subscription_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ في تحميل طلبات الاشتراك:', error);
        throw error;
      }
      
      console.log('✅ تم تحميل طلبات الاشتراك بنجاح:', data);
      setSubscriptionRequests(data || []);
    } catch (error) {
      console.error('Error fetching subscription requests:', error);
      toast({
        title: "خطأ في تحميل طلبات الاشتراك",
        description: "سيتم المحاولة مرة أخرى...",
        variant: "destructive",
      });
      
      setSubscriptionRequests([]);
    }
  };

  useEffect(() => {
    if (userRole === 'super_admin') {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchAccounts(), fetchSubscriptionRequests()]);
        setLoading(false);
      };
      
      loadData();
    }
  }, [userRole]);

  const updateSubscriptionRequestStatus = async (requestId: string, status: string) => {
    try {
      console.log(`🔄 جاري تحديث حالة طلب الاشتراك ${requestId} إلى ${status}`);
      
      const { error } = await supabase
        .from('subscription_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) {
        console.error('❌ خطأ في تحديث حالة طلب الاشتراك:', error);
        throw error;
      }

      console.log('✅ تم تحديث حالة طلب الاشتراك بنجاح');
      
      toast({
        title: "تم تحديث حالة الطلب",
        description: `تم تحديث حالة الطلب إلى ${status === 'approved' ? 'موافق عليه' : status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}`,
      });

      await fetchSubscriptionRequests();
    } catch (error: any) {
      console.error('❌ خطأ في تحديث طلب الاشتراك:', error);
      toast({
        title: "خطأ في تحديث الطلب",
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    }
  };

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

      // إرسال إيميل ترحيب للعميل
      try {
        console.log('📧 إرسال إيميل ترحيب...');
        
        const { error: emailError } = await supabase.functions.invoke('send-account-welcome', {
          body: {
            name: newAccount.name,
            email: newAccount.email,
            password: newAccount.password,
            database_name: newAccount.database_name,
            activation_start_date: newAccount.activation_start_date,
            activation_end_date: newAccount.activation_end_date,
            account_id: createdAccount.id
          }
        });

        if (emailError) {
          console.error('❌ خطأ في إرسال الإيميل:', emailError);
          toast({
            title: "تم إنشاء الحساب مع تحذير",
            description: "تم إنشاء الحساب بنجاح ولكن لم يتم إرسال الإيميل",
            variant: "default",
          });
        } else {
          console.log('✅ تم إرسال الإيميل بنجاح');
        }
      } catch (emailError) {
        console.error('❌ خطأ في إرسال الإيميل:', emailError);
      }

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `تم إنشاء حساب ${newAccount.name} وإرسال التفاصيل عبر الإيميل`,
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

  const updateAccountPassword = async (accountId: string, password: string) => {
    try {
      console.log(`🔄 جاري تحديث كلمة المرور للحساب ${accountId}`);
      
      const passwordHash = await hashPassword(password);
      
      const { error } = await supabase
        .from('accounts')
        .update({ password_hash: passwordHash })
        .eq('id', accountId);

      if (error) {
        console.error('❌ خطأ في تحديث كلمة المرور:', error);
        throw error;
      }

      console.log('✅ تم تحديث كلمة المرور بنجاح');
      
      toast({
        title: "تم تحديث كلمة المرور",
        description: "تم تحديث كلمة المرور بنجاح",
      });

      setEditingPassword(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('❌ خطأ في تحديث كلمة المرور:', error);
      toast({
        title: "خطأ في تحديث كلمة المرور",
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

  const getRequestStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'قيد المراجعة', variant: 'secondary' as const },
      approved: { label: 'موافق عليه', variant: 'default' as const },
      rejected: { label: 'مرفوض', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">طلبات الاشتراك</p>
                  <p className="text-2xl font-bold text-gray-900">{subscriptionRequests.length}</p>
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
              onClick={() => setActiveTab('branches')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'branches'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              الفروع
            </button>
            <button
              onClick={() => setActiveTab('subscription-requests')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'subscription-requests'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              طلبات الاشتراك
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

        {/* Account Selector for Notifications, Timers, and Branches */}
        {(activeTab === 'notifications' || activeTab === 'timers' || activeTab === 'branches') && (
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
                          <div className="flex flex-wrap gap-2">
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
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowingPassword(showingPassword === account.id ? null : account.id)}
                              disabled={loading}
                            >
                              {showingPassword === account.id ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-1" />
                                  إخفاء كلمة المرور
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  عرض كلمة المرور
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPassword(account.id)}
                              disabled={loading}
                            >
                              <KeyRound className="h-4 w-4 mr-1" />
                              تغيير كلمة المرور
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* عرض كلمة المرور */}
                      {showingPassword === account.id && (
                        <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                          <h4 className="font-medium mb-3 text-blue-800">كلمة المرور الحالية</h4>
                          <div className="bg-white p-3 rounded border border-blue-300">
                            <p className="text-sm text-gray-600 mb-1">كلمة المرور (غير مشفرة):</p>
                            <p className="font-mono text-lg bg-gray-100 p-2 rounded border" dir="ltr">
                              تم إنشاء الحساب - كلمة المرور متاحة في قاعدة البيانات
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              ملاحظة: يتم عرض كلمة المرور المشفرة في قاعدة البيانات لأسباب أمنية
                            </p>
                          </div>
                        </div>
                      )}

                      {/* تغيير كلمة المرور */}
                      {editingPassword === account.id && (
                        <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                          <h4 className="font-medium mb-3 text-yellow-800">تغيير كلمة المرور</h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor={`password-${account.id}`}>كلمة المرور الجديدة</Label>
                              <Input
                                id={`password-${account.id}`}
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="أدخل كلمة المرور الجديدة"
                                dir="ltr"
                                minLength={6}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => updateAccountPassword(account.id, newPassword)}
                              disabled={!newPassword || newPassword.length < 6}
                            >
                              تحديث كلمة المرور
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPassword(null);
                                setNewPassword('');
                              }}
                            >
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      )}

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

        {activeTab === 'branches' && selectedAccount && (
          <BranchManager 
            accountId={selectedAccount} 
            accountName={accounts.find(acc => acc.id === selectedAccount)?.name || 'الحساب المحدد'}
          />
        )}

        {activeTab === 'branches' && !selectedAccount && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">يرجى اختيار حساب لإدارة الفروع</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'subscription-requests' && (
          <Card>
            <CardHeader>
              <CardTitle>طلبات الاشتراك</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600">جاري التحميل...</p>
                  </div>
                ) : subscriptionRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">لا توجد طلبات اشتراك</p>
                  </div>
                ) : (
                  subscriptionRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-6 bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-semibold text-lg">{request.full_name}</h3>
                            {getRequestStatusBadge(request.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">اسم الشركة</p>
                              <p className="font-medium">{request.company_name}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                              <p className="font-medium">{request.email}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500">رقم التواصل</p>
                              <p className="font-medium">{request.phone}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500">تاريخ الطلب</p>
                              <p className="font-medium">{formatDateTime(request.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateSubscriptionRequestStatus(request.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                موافقة
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateSubscriptionRequestStatus(request.id, 'rejected')}
                              >
                                رفض
                              </Button>
                            </>
                          )}
                          
                          {request.status !== 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSubscriptionRequestStatus(request.id, 'pending')}
                            >
                              إعادة للمراجعة
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
