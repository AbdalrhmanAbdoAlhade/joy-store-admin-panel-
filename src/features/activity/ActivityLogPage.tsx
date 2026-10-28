import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, RefreshCw, Filter } from 'lucide-react';
import { activityService } from '@/src/services/activityService';
import EmptyState from '@/src/components/common/EmptyState';

export const ActivityLogPage: React.FC = () => {
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const { refetch, isFetching } = useQuery({
    queryKey: ['activity', 'logs'],
    queryFn: () => activityService.getActivityLogs(),
  });

  const disabledClass =
    'w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 cursor-not-allowed';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isAr ? 'سجل النشاط' : 'Activity Log'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'تتبّع عمليات المستخدمين والموظفين في لوحة التحكم' : 'Track user and staff actions across the admin panel'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>{isAr ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-xs font-medium leading-relaxed">
          {isAr ? 'سجل النشاط قيد التطوير — سيتم تفعيله قريباً' : 'Activity log is under development — coming soon'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 inline-flex items-center gap-1">
              <Filter className="w-3 h-3" />
              {isAr ? 'نوع العملية' : 'Action type'}
            </label>
            <select disabled className={disabledClass}>
              <option>{isAr ? 'الكل' : 'All'}</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {isAr ? 'المستخدم' : 'User'}
            </label>
            <select disabled className={disabledClass}>
              <option>{isAr ? 'الكل' : 'All'}</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {isAr ? 'التاريخ' : 'Date'}
            </label>
            <input type="date" disabled className={disabledClass} />
          </div>
        </div>

        <EmptyState
          icon={Activity}
          message={isAr ? 'لا يوجد سجل نشاط' : 'No activity log'}
          description={
            isAr
              ? 'ستظهر هنا عمليات المستخدمين عند تفعيل الخدمة'
              : 'User actions will appear here once the service is enabled'
          }
        />
      </div>
    </div>
  );
};

export default ActivityLogPage;
