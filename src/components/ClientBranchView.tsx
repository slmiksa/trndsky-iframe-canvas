
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Phone, Settings, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

interface ClientBranchViewProps {
  accountId: string;
  onSelectBranch: (branchId: string, branchName: string) => void;
  selectedBranch?: string;
}

const ClientBranchView = ({ accountId, onSelectBranch, selectedBranch }: ClientBranchViewProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBranches = async () => {
    try {
      console.log(`🔍 جاري تحميل فروع الحساب ${accountId}...`);
      
      const { data, error } = await supabase
        .from('account_branches' as any)
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل الفروع...</p>
        </CardContent>
      </Card>
    );
  }

  if (branches.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">لا توجد فروع متاحة حالياً</p>
          <p className="text-sm text-gray-500 mt-2">
            سيتم عرض الفروع هنا عندما يقوم المدير بإضافتها
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            فروع الحساب ({branches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Card 
                key={branch.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedBranch === branch.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSelectBranch(branch.id, branch.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{branch.name}</h3>
                    <Badge variant="default">نشط</Badge>
                  </div>
                  
                  {branch.description && (
                    <p className="text-sm text-gray-600 mb-2">{branch.description}</p>
                  )}
                  
                  {branch.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{branch.location}</span>
                    </div>
                  )}
                  
                  {branch.contact_info && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <Phone className="h-4 w-4" />
                      <span>{branch.contact_info}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-xs text-gray-400">
                      أنشئ في: {formatDate(branch.created_at)}
                    </span>
                    
                    <Button 
                      size="sm" 
                      variant={selectedBranch === branch.id ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBranch(branch.id, branch.name);
                      }}
                    >
                      {selectedBranch === branch.id ? (
                        <>
                          <Settings className="h-4 w-4 mr-1" />
                          مُحدد
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          اختيار
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientBranchView;
