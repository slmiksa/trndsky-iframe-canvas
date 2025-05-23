
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface AccountStatusCardProps {
  activationStartDate: string | null;
  activationEndDate: string | null;
  status: 'active' | 'suspended' | 'pending';
  accountName: string;
}

const AccountStatusCard = ({ 
  activationStartDate, 
  activationEndDate, 
  status,
  accountName 
}: AccountStatusCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAccountStatus = () => {
    if (status === 'suspended') {
      return {
        label: 'معلق',
        variant: 'destructive' as const,
        icon: <XCircle className="h-4 w-4" />,
        color: 'text-red-600'
      };
    }

    if (status === 'pending') {
      return {
        label: 'في انتظار التفعيل',
        variant: 'secondary' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-yellow-600'
      };
    }

    if (!activationEndDate) {
      return {
        label: 'نشط',
        variant: 'default' as const,
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-green-600'
      };
    }

    const now = new Date();
    const endDate = new Date(activationEndDate);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      return {
        label: 'منتهي الصلاحية',
        variant: 'destructive' as const,
        icon: <XCircle className="h-4 w-4" />,
        color: 'text-red-600'
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        label: `ينتهي خلال ${daysUntilExpiry} أيام`,
        variant: 'destructive' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-red-600'
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        label: `ينتهي خلال ${daysUntilExpiry} يوم`,
        variant: 'secondary' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-yellow-600'
      };
    } else {
      return {
        label: 'نشط',
        variant: 'default' as const,
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-green-600'
      };
    }
  };

  const accountStatus = getAccountStatus();

  const handleRenewal = () => {
    window.open('https://trndsky.com', '_blank');
  };

  const isExpiringSoon = activationEndDate && status === 'active' && (() => {
    const now = new Date();
    const endDate = new Date(activationEndDate);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  })();

  return (
    <Card className={`${isExpiringSoon ? 'border-yellow-200 bg-yellow-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            حالة الاشتراك
          </CardTitle>
          <div className="flex items-center gap-2">
            {accountStatus.icon}
            <Badge variant={accountStatus.variant} className="flex items-center gap-1">
              {accountStatus.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activationStartDate && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">تاريخ بداية الاشتراك</p>
              <p className="text-lg font-semibold">{formatDate(activationStartDate)}</p>
            </div>
          )}
          
          {activationEndDate && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">تاريخ انتهاء الاشتراك</p>
              <p className={`text-lg font-semibold ${accountStatus.color}`}>
                {formatDate(activationEndDate)}
              </p>
            </div>
          )}
        </div>

        {isExpiringSoon && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-800 mb-2">تنبيه: اشتراكك قارب على الانتهاء</h4>
                <p className="text-yellow-700 text-sm mb-3">
                  لضمان استمرارية الخدمة، يرجى تجديد اشتراكك قبل انتهاء التاريخ المحدد.
                </p>
                <Button onClick={handleRenewal} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  تجديد الاشتراك الآن
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === 'suspended' && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-2">حساب معلق</h4>
                <p className="text-red-700 text-sm mb-3">
                  تم تعليق حسابك. يرجى التواصل معنا لتفعيل الحساب مرة أخرى.
                </p>
                <Button onClick={handleRenewal} size="sm" variant="destructive">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  تواصل معنا
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2">في انتظار التفعيل</h4>
                <p className="text-gray-700 text-sm mb-3">
                  حسابك في انتظار التفعيل. سيتم تفعيله قريباً.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountStatusCard;
