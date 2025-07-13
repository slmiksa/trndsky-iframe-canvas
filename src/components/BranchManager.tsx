
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Building2, Edit, Trash2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Branch {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  contact_info: string | null;
  is_active: boolean;
  account_id: string;
  created_at: string;
  updated_at: string;
}

interface BranchManagerProps {
  accountId: string;
  accountName: string;
}

const BranchManager = ({ accountId, accountName }: BranchManagerProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [newBranch, setNewBranch] = useState({
    name: '',
    description: '',
    location: '',
    contact_info: '',
  });

  const fetchBranches = async () => {
    try {
      console.log(`🔍 جاري تحميل فروع الحساب ${accountId}...`);
      
      const { data, error } = await supabase
        .from('account_branches' as any)
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ في تحميل الفروع:', error);
        throw error;
      }
      
      console.log('✅ تم تحميل الفروع بنجاح:', data);
      setBranches(data as Branch[] || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: "خطأ في تحميل الفروع",
        description: "سيتم المحاولة مرة أخرى...",
        variant: "destructive",
      });
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [accountId]);

  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBranch.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم الفرع",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 بداية إنشاء فرع جديد:', newBranch);
      
      const branchData = {
        account_id: accountId,
        name: newBranch.name.trim(),
        description: newBranch.description.trim() || null,
        location: newBranch.location.trim() || null,
        contact_info: newBranch.contact_info.trim() || null,
        is_active: true
      };

      const { data: createdBranch, error } = await supabase
        .from('account_branches' as any)
        .insert(branchData)
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ في إنشاء الفرع:', error);
        throw error;
      }

      console.log('✅ تم إنشاء الفرع بنجاح:', createdBranch);

      toast({
        title: "تم إنشاء الفرع بنجاح",
        description: `تم إنشاء فرع ${newBranch.name} لحساب ${accountName}`,
      });

      setNewBranch({ name: '', description: '', location: '', contact_info: '' });
      setShowCreateForm(false);
      await fetchBranches();
      
    } catch (error: any) {
      console.error('❌ خطأ في إنشاء الفرع:', error);
      toast({
        title: "خطأ في إنشاء الفرع",
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBranchStatus = async (branchId: string, isActive: boolean) => {
    try {
      console.log(`🔄 جاري تحديث حالة الفرع ${branchId} إلى ${isActive ? 'نشط' : 'معطل'}`);
      
      const { error } = await supabase
        .from('account_branches' as any)
        .update({ is_active: isActive })
        .eq('id', branchId);

      if (error) {
        console.error('❌ خطأ في تحديث حالة الفرع:', error);
        throw error;
      }

      console.log('✅ تم تحديث حالة الفرع بنجاح');
      
      toast({
        title: "تم تحديث حالة الفرع",
        description: `تم ${isActive ? 'تفعيل' : 'إيقاف'} الفرع بنجاح`,
      });

      await fetchBranches();
    } catch (error: any) {
      console.error('❌ خطأ في تحديث الفرع:', error);
      toast({
        title: "خطأ في تحديث الفرع",
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    }
  };

  const deleteBranch = async (branchId: string, branchName: string) => {
    if (!confirm(`هل أنت متأكد من حذف فرع "${branchName}"؟`)) {
      return;
    }

    try {
      console.log(`🗑️ جاري حذف الفرع ${branchId}`);
      
      const { error } = await supabase
        .from('account_branches' as any)
        .delete()
        .eq('id', branchId);

      if (error) {
        console.error('❌ خطأ في حذف الفرع:', error);
        throw error;
      }

      console.log('✅ تم حذف الفرع بنجاح');
      
      toast({
        title: "تم حذف الفرع",
        description: `تم حذف فرع ${branchName} بنجاح`,
      });

      await fetchBranches();
    } catch (error: any) {
      console.error('❌ خطأ في حذف الفرع:', error);
      toast({
        title: "خطأ في حذف الفرع",
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            إدارة فروع {accountName}
          </CardTitle>
          <Button onClick={() => setShowCreateForm(true)} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة فرع جديد
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showCreateForm && (
          <form onSubmit={createBranch} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="branch-name">اسم الفرع *</Label>
                <Input
                  id="branch-name"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                  required
                  placeholder="أدخل اسم الفرع"
                />
              </div>
              <div>
                <Label htmlFor="branch-location">الموقع</Label>
                <Input
                  id="branch-location"
                  value={newBranch.location}
                  onChange={(e) => setNewBranch({...newBranch, location: e.target.value})}
                  placeholder="أدخل موقع الفرع"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="branch-description">الوصف</Label>
                <Input
                  id="branch-description"
                  value={newBranch.description}
                  onChange={(e) => setNewBranch({...newBranch, description: e.target.value})}
                  placeholder="أدخل وصف الفرع"
                />
              </div>
              <div>
                <Label htmlFor="branch-contact">معلومات التواصل</Label>
                <Input
                  id="branch-contact"
                  value={newBranch.contact_info}
                  onChange={(e) => setNewBranch({...newBranch, contact_info: e.target.value})}
                  placeholder="رقم التلفون أو البريد الإلكتروني"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الإضافة...' : 'إضافة الفرع'}
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
          {loading && branches.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600">جاري التحميل...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد فروع لهذا الحساب بعد</p>
              <p className="text-sm text-gray-500">ابدأ بإضافة فرع جديد</p>
            </div>
          ) : (
            branches.map((branch) => (
              <div key={branch.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {branch.name}
                      </h3>
                      <Badge variant={branch.is_active ? "default" : "secondary"}>
                        {branch.is_active ? 'نشط' : 'معطل'}
                      </Badge>
                    </div>
                    
                    {branch.description && (
                      <p className="text-sm text-gray-600 mb-1">{branch.description}</p>
                    )}
                    
                    {branch.location && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {branch.location}
                      </p>
                    )}
                    
                    {branch.contact_info && (
                      <p className="text-sm text-gray-500">{branch.contact_info}</p>
                    )}
                    
                    <div className="text-xs text-gray-400 mt-2">
                      <p>تاريخ الإنشاء: {formatDate(branch.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {branch.is_active ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBranchStatus(branch.id, false)}
                        disabled={loading}
                      >
                        إيقاف
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => updateBranchStatus(branch.id, true)}
                        disabled={loading}
                      >
                        تفعيل
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteBranch(branch.id, branch.name)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BranchManager;
