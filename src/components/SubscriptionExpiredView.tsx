
import React from 'react';

interface Account {
  name: string;
  activation_end_date: string | null;
}

interface SubscriptionExpiredViewProps {
  account: Account;
}

const SubscriptionExpiredView: React.FC<SubscriptionExpiredViewProps> = ({ account }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            انتهت صلاحية الحساب
          </h1>
          
          <p className="text-gray-600 mb-6">
            عذراً، لقد انتهت صلاحية حساب <strong>{account.name}</strong> في تاريخ{' '}
            {account.activation_end_date ? 
              new Date(account.activation_end_date).toLocaleDateString('ar-SA') 
              : 'غير محدد'
            }
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            لتجديد الاشتراك والمتابعة، يرجى التواصل معنا عبر الرابط أدناه
          </p>
          
          <a
            href="https://trndsky.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            تجديد الاشتراك
          </a>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              للمساعدة التقنية: support@trndsky.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiredView;
