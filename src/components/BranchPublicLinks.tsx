
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Share2, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Branch {
  id: string;
  branch_name: string;
  branch_path: string;
  is_active: boolean;
}

interface BranchPublicLinksProps {
  accountName: string;
  branches: Branch[];
  selectedBranchId: string | null;
}

const BranchPublicLinks: React.FC<BranchPublicLinksProps> = ({ 
  accountName, 
  branches, 
  selectedBranchId 
}) => {
  const copyBranchLink = (branchPath: string) => {
    const publicUrl = `${window.location.origin}/client/${accountName}/${branchPath}`;
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: "تم نسخ الرابط",
      description: `رابط فرع ${branchPath} تم نسخه`
    });
  };

  const openBranchPage = (branchPath: string) => {
    const publicUrl = `/client/${accountName}/${branchPath}`;
    window.open(publicUrl, '_blank');
  };

  const copyMainLink = () => {
    const publicUrl = `${window.location.origin}/client/${accountName}`;
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: "تم نسخ الرابط",
      description: "رابط الحساب الرئيسي تم نسخه"
    });
  };

  const openMainPage = () => {
    const publicUrl = `/client/${accountName}`;
    window.open(publicUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          روابط صفحات العرض
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Account Link */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default">الحساب الرئيسي</Badge>
              {!selectedBranchId && (
                <Badge variant="secondary" className="text-xs">مختار حالياً</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 break-all">
              /client/{accountName}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={copyMainLink}>
              <Share2 className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={openMainPage}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Branch Links */}
        {branches.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">روابط الفروع</h4>
            {branches.map((branch) => (
              <div 
                key={branch.id} 
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  selectedBranchId === branch.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{branch.branch_name}</Badge>
                    {selectedBranchId === branch.id && (
                      <Badge variant="secondary" className="text-xs">مختار حالياً</Badge>
                    )}
                    {!branch.is_active && (
                      <Badge variant="destructive" className="text-xs">معطل</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 break-all">
                    /client/{accountName}/{branch.branch_path}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyBranchLink(branch.branch_path)}
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => openBranchPage(branch.branch_path)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg">
          <p className="font-medium mb-1">💡 ملاحظة:</p>
          <p>• الرابط الرئيسي يعرض المحتوى العام للحساب</p>
          <p>• رابط كل فرع يعرض المحتوى الخاص بذلك الفرع فقط</p>
          <p>• تأكد من إنشاء محتوى خاص لكل فرع في التبويبات أعلاه</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BranchPublicLinks;
