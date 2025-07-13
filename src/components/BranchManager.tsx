
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Plus, Edit2, Trash2, Globe, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Branch {
  id: string;
  branch_name: string;
  branch_path: string;
  is_active: boolean;
  created_at: string;
  account_id: string;
}

interface BranchManagerProps {
  accountId: string;
  onBranchSelect?: (branchId: string | null) => void;
  selectedBranchId?: string | null;
}

const BranchManager: React.FC<BranchManagerProps> = ({ accountId, onBranchSelect, selectedBranchId }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchPath, setNewBranchPath] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadBranches();
  }, [accountId]);

  const loadBranches = async () => {
    try {
      console.log('🔍 Loading branches from database for account:', accountId);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('account_branches')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error loading branches:', error);
        throw error;
      }

      setBranches(data || []);
      console.log('✅ Branches loaded from database:', data);
    } catch (error) {
      console.error('Error loading branches:', error);
      toast({
        title: t('error'),
        description: 'فشل في تحميل الفروع من قاعدة البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    if (!newBranchName.trim() || !newBranchPath.trim()) {
      toast({
        title: t('error'),
        description: t('please_fill_all_fields'),
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('➕ Adding new branch to database:', {
        accountId,
        branch_name: newBranchName.trim(),
        branch_path: newBranchPath.trim(),
      });

      const { data, error } = await supabase
        .from('account_branches')
        .insert({
          account_id: accountId,
          branch_name: newBranchName.trim(),
          branch_path: newBranchPath.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding branch:', error);
        throw error;
      }

      console.log('✅ Branch added successfully:', data);
      
      setNewBranchName('');
      setNewBranchPath('');
      setIsAddDialogOpen(false);
      
      toast({
        title: t('success'),
        description: t('branch_added_successfully'),
      });
      
      loadBranches(); // Reload branches from database
    } catch (error: any) {
      console.error('Error adding branch:', error);
      toast({
        title: t('error'),
        description: error.message || t('failed_to_add_branch'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch || !newBranchName.trim() || !newBranchPath.trim()) return;

    try {
      console.log('✏️ Updating branch in database:', editingBranch.id);
      
      const { error } = await supabase
        .from('account_branches')
        .update({
          branch_name: newBranchName.trim(),
          branch_path: newBranchPath.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBranch.id);

      if (error) {
        console.error('❌ Error updating branch:', error);
        throw error;
      }

      console.log('✅ Branch updated successfully');
      
      setEditingBranch(null);
      setNewBranchName('');
      setNewBranchPath('');
      
      toast({
        title: t('success'),
        description: t('branch_updated_successfully'),
      });
      
      loadBranches(); // Reload branches from database
    } catch (error: any) {
      console.error('Error updating branch:', error);
      toast({
        title: t('error'),
        description: error.message || t('failed_to_update_branch'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    try {
      console.log('🗑️ Deleting branch from database:', branchId);
      
      const { error } = await supabase
        .from('account_branches')
        .delete()
        .eq('id', branchId);

      if (error) {
        console.error('❌ Error deleting branch:', error);
        throw error;
      }

      console.log('✅ Branch deleted successfully');
      
      toast({
        title: t('success'),
        description: t('branch_deleted_successfully'),
      });
      
      loadBranches(); // Reload branches from database
    } catch (error: any) {
      console.error('Error deleting branch:', error);
      toast({
        title: t('error'),
        description: error.message || t('failed_to_delete_branch'),
        variant: 'destructive',
      });
    }
  };

  const toggleBranchStatus = async (branchId: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Toggling branch status in database:', branchId);
      
      const { error } = await supabase
        .from('account_branches')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', branchId);

      if (error) {
        console.error('❌ Error updating branch status:', error);
        throw error;
      }

      console.log('✅ Branch status updated successfully');
      
      toast({
        title: t('success'),
        description: t('branch_status_updated'),
      });
      
      loadBranches(); // Reload branches from database
    } catch (error: any) {
      console.error('Error updating branch status:', error);
      toast({
        title: t('error'),
        description: error.message || t('failed_to_update_branch_status'),
        variant: 'destructive',
      });
    }
  };

  const handleBranchSelect = (branchId: string | null) => {
    console.log('🔄 Branch selected:', branchId);
    onBranchSelect?.(branchId);
    
    // Store selected branch in localStorage for persistence
    if (branchId) {
      localStorage.setItem(`selected_branch_${accountId}`, branchId);
    } else {
      localStorage.removeItem(`selected_branch_${accountId}`);
    }
    
    toast({
      title: t('success'),
      description: branchId ? 'تم تحديد الفرع' : 'تم تحديد الحساب الرئيسي',
    });
  };

  if (loading) {
    return <div className="p-4 text-center">{t('loading')}...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {t('branches_management')}
          {selectedBranchId && (
            <Badge variant="secondary" className="ml-2">
              {branches.find(b => b.id === selectedBranchId)?.branch_name || 'محدد'}
            </Badge>
          )}
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('add_branch')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('add_new_branch')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('branch_name')}</label>
                <Input
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder={t('enter_branch_name')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('branch_path')}</label>
                <Input
                  value={newBranchPath}
                  onChange={(e) => setNewBranchPath(e.target.value)}
                  placeholder="1, 2, main, etc."
                />
              </div>
              <Button onClick={handleAddBranch} className="w-full">
                {t('add_branch')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Main Account Option */}
          <Card className={`border-primary/20 ${selectedBranchId === null ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">{t('main_account')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('controls_all_branches')}
                    </p>
                  </div>
                </div>
                <Button
                  variant={selectedBranchId === null ? "default" : "outline"}
                  onClick={() => handleBranchSelect(null)}
                >
                  {selectedBranchId === null ? 'محدد' : t('select')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Branches List */}
          {branches.map((branch) => (
            <Card 
              key={branch.id} 
              className={`${!branch.is_active ? 'opacity-60' : ''} ${selectedBranchId === branch.id ? 'ring-2 ring-primary' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{branch.branch_name}</h3>
                        <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                          {branch.is_active ? t('active') : t('inactive')}
                        </Badge>
                        {selectedBranchId === branch.id && (
                          <Badge variant="outline" className="text-primary">
                            محدد
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        /{branch.branch_path}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedBranchId === branch.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleBranchSelect(branch.id)}
                      disabled={!branch.is_active}
                    >
                      {selectedBranchId === branch.id ? 'محدد' : t('select')}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBranchStatus(branch.id, branch.is_active)}
                    >
                      {branch.is_active ? t('deactivate') : t('activate')}
                    </Button>
                    
                    <Dialog open={editingBranch?.id === branch.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditingBranch(null);
                        setNewBranchName('');
                        setNewBranchPath('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingBranch(branch);
                            setNewBranchName(branch.branch_name);
                            setNewBranchPath(branch.branch_path);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('edit_branch')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">{t('branch_name')}</label>
                            <Input
                              value={newBranchName}
                              onChange={(e) => setNewBranchName(e.target.value)}
                              placeholder={t('enter_branch_name')}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">{t('branch_path')}</label>
                            <Input
                              value={newBranchPath}
                              onChange={(e) => setNewBranchPath(e.target.value)}
                              placeholder="1, 2, main, etc."
                            />
                          </div>
                          <Button onClick={handleUpdateBranch} className="w-full">
                            {t('update_branch')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('delete_branch')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('are_you_sure_delete_branch')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteBranch(branch.id)}>
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BranchManager;
