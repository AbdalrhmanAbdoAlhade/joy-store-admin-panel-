import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, LayoutDashboard } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-xs">
        <div className="inline-flex p-3 mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          <FileQuestion className="w-8 h-8" />
        </div>
        <p className="text-5xl font-black tracking-tight text-blue-600 mb-1">404</p>
        <h1 className="text-xl font-bold tracking-tight mb-2">الصفحة غير موجودة</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          الصفحة أو المورد الذي تحاول الوصول إليه غير موجود أو تم نقله.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          رجوع للوحة التحكم
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
