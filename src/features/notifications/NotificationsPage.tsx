import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { notificationService } from '@/src/services/notificationService';
import EmptyState from '@/src/components/common/EmptyState';

export const NotificationsPage: React.FC = () => {
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const { refetch, isFetching } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationService.getNotifications(),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isAr ? 'الإشعارات' : 'Notifications'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'مركز الإشعارات والتنبيهات الإدارية' : 'Admin notifications and alerts center'}
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
          {isAr
            ? 'خدمة الإشعارات قيد التطوير — سيتم تفعيلها قريباً'
            : 'Notifications service is under development — coming soon'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <EmptyState
          icon={BellOff}
          message={isAr ? 'لا توجد إشعارات' : 'No notifications'}
          description={
            isAr
              ? 'ستظهر هنا إشعارات النظام عند تفعيل الخدمة'
              : 'System notifications will appear here once the service is enabled'
          }
        />
      </div>
    </div>
  );
};

export default NotificationsPage;
