
import React from 'react';

interface ErrorViewProps {
  error: string | null;
}

const ErrorView: React.FC<ErrorViewProps> = ({ error }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">خطأ</h1>
        <p className="text-gray-600">{error || 'لم يتم العثور على الحساب'}</p>
      </div>
    </div>
  );
};

export default ErrorView;
