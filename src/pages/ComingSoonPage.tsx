import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Construction, Home } from 'lucide-react';

export const ComingSoonPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-xs">
        <div className="inline-flex p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          <Construction className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-2 text-slate-900 dark:text-slate-100">
          قريباً
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          هذه الميزة غير متوفرة في الخادم حالياً وستُطلق في تحديثٍ قادم.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          العودة للوحة المعلومات
        </button>
      </div>
    </div>
  );
};

export default ComingSoonPage;
