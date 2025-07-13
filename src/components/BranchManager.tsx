
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
}

const BranchManager: React.FC<BranchManagerProps> = ({ accountId, onBranchSelect }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchPath, setNewBranchPath] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchBranches();
  }, [accountId]);

  const fetchBranches = async () => {
    try {
      console.log('🔍 Fetching branches for account:', accountId);
      
      const { data, error } = await supabase
        .rpc('get_account_branches', { account_id_param: accountId });

      if (error) {
        console.error('❌ Error fetching branches via RPC:', error);
        // Fallback to direct query
        const { data: directData, error: directError } = await supabase
          .from('account_branches')
          .select('*')
          .eq('account_id', accountId)
          .order('created_at', { ascending: true });
        
        if (directError) {
          console.error('❌ Error fetching branches directly:', directError);
          throw directError;
        }
        
        console.log('✅ Branches fetched via direct query:', directData);
        setBranches(directData || []);
      } else {
        console.log('✅ Branches fetched via RPC:', data);
        setBranches(data || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: t('error'),
        description: t('failed_to_load_branches'),
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
      console.log('➕ Adding new branch:', {
        accountId,
        branch_name: newBranchName.trim(),
        branch_path: newBranchPath.trim(),
      });

      // Check current user authentication
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id);

      // Try using the RPC function first
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('create_account_branch', {
          account_id_param: accountId,
          branch_name_param: newBranchName.trim(),
          branch_path_param: newBranchPath.trim()
        });

      if (rpcError) {
        console.error('❌ Error creating branch via RPC:', rpcError);
        
        // Fallback to direct insert
        const { data: insertData, error: insertError } = await supabase
          .from('account_branches')
          .insert({
            account_id: accountId,
            branch_name: newBranchName.trim(),
            branch_path: newBranchPath.trim(),
            is_active: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating branch via direct insert:', insertError);
          throw insertError;
        }

        console.log('✅ Branch created via direct insert:', insertData);
        setBranches([...branches, insertData]);
      } else {
        console.log('✅ Branch created via RPC, ID:', rpcData);
        // Fetch the created branch details
        const { data: newBranch, error: fetchError } = await supabase
          .from('account_branches')
          .select('*')
          .eq('id', rpcData)
          .single();
        
        if (!fetchError && newBranch) {
          setBranches([...branches, newBranch]);
        } else {
          // Refetch all branches if we can't get the specific one
          fetchBranches();
        }
      }

      setNewBranchName('');
      setNewBranchPath('');
      setIsAddDialogOpen(false);
      
      toast({
        title: t('success'),
        description: t('branch_added_successfully'),
      });
    } catch (error) {
      console.error('Error adding branch:', error);
      toast({
        title: t('error'),
        description: t('failed_to_add_branch'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch || !newBranchName.trim() || !newBranchPath.trim()) return;

    try {
      const { error } = await supabase
        .rpc('update_account_branch', {
          branch_id_param: editingBranch.id,
          branch_name_param: newBranchName.trim(),
          branch_path_param: newBranchPath.trim(),
        });

      if (error) {
        console.error('❌ Error updating branch via RPC:', error);
        
        // Fallback to direct update
        const { data: updateData, error: updateError } = await supabase
          .from('account_branches')
          .update({
            branch_name: newBranchName.trim(),
            branch_path: newBranchPath.trim(),
          })
          .eq('id', editingBranch.id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        setBranches(branches.map(b => b.id === editingBranch.id ? updateData : b));
      } else {
        // Refetch branches after RPC update
        fetchBranches();
      }

      setEditingBranch(null);
      setNewBranchName('');
      setNewBranchPath('');
      
      toast({
        title: t('success'),
        description: t('branch_updated_successfully'),
      });
    } catch (error) {
      console.error('Error updating branch:', error);
      toast({
        title: t('error'),
        description: t('failed_to_update_branch'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    try {
      const { error: rpcError } = await supabase
        .rpc('delete_account_branch', { branch_id_param: branchId });

      if (rpcError) {
        console.error('❌ Error deleting branch via RPC:', rpcError);
        
        // Fallback to direct delete
        const { error: deleteError } = await supabase
          .from('account_branches')
          .delete()
          .eq('id', branchId);

        if (deleteError) throw deleteError;
      }

      setBranches(branches.filter(b => b.id !== branchId));
      
      toast({
        title: t('success'),
        description: t('branch_deleted_successfully'),
      });
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({
        title: t('error'),
        description: t('failed_to_delete_branch'),
        variant: 'destructive',
      });
    }
  };

  const toggleBranchStatus = async (branchId: string, currentStatus: boolean) => {
    try {
      const { error: rpcError } = await supabase
        .rpc('toggle_branch_status', {
          branch_id_param: branchId,
          new_status: !currentStatus
        });

      if (rpcError) {
        console.error('❌ Error toggling branch status via RPC:', rpcError);
        
        // Fallback to direct update
        const { data, error: updateError } = await supabase
          .from('account_branches')
          .update({ is_active: !currentStatus })
          .eq('id', branchId)
          .select()
          .single();

        if (updateError) throw updateError;
        
        setBranches(branches.map(b => b.id === branchId ? data : b));
      } else {
        // Refetch branches after RPC update
        fetchBranches();
      }
      
      toast({
        title: t('success'),
        description: t('branch_status_updated'),
      });
    } catch (error) {
      console.error('Error updating branch status:', error);
      toast({
        title: t('error'),
        description: t('failed_to_update_branch_status'),
        variant: 'destructive',
      });
    }
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
          <Card className="border-primary/20">
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
                  variant="outline"
                  onClick={() => onBranchSelect?.(null)}
                >
                  {t('select')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Branches List */}
          {branches.map((branch) => (
            <Card key={branch.id} className={!branch.is_active ? 'opacity-60' : ''}>
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
                      </div>
                      <p className="text-sm text-muted-foreground">
                        /{branch.branch_path}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBranchSelect?.(branch.id)}
                    >
                      {t('select')}
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
                            {t('delete')}
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
