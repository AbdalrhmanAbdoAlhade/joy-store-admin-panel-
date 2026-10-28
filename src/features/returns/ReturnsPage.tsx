import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Check, X, PackageCheck, Inbox } from 'lucide-react';
import { returnsService } from '@/src/services/returnsService';
import { ReturnRequest, ReturnStatus } from '@/src/types/return';
import StatusBadge, { type BadgeVariant } from '@/src/components/common/StatusBadge';
import EmptyState from '@/src/components/common/EmptyState';
import { localizedText } from '@/src/lib/api-helpers';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { toast } from 'sonner';

type FilterStatus = ReturnStatus | 'all';

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: 'بانتظار المراجعة' },
  { key: 'approved', label: 'موافق عليه' },
  { key: 'received', label: 'تم استلام الشحنة' },
  { key: 'rejected', label: 'مرفوض' },
];

const STATUS_META: Record<ReturnStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'بانتظار المراجعة', variant: 'warning' },
  approved: { label: 'موافق عليه', variant: 'success' },
  received: { label: 'تم استلام الشحنة', variant: 'info' },
  rejected: { label: 'مرفوض', variant: 'danger' },
};

const REASON_LABELS: Record<string, string> = {
  defective: 'منتج معيب',
  wrong_item: 'صنف خاطئ',
  not_as_described: 'غير مطابق للوصف',
  changed_mind: 'تغيير رأي',
};

const CONDITION_LABELS: Record<string, string> = {
  unopened: 'غير مفتوح',
  opened: 'مفتوح',
  damaged: 'تالف',
};

export const ReturnsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [rejectModalId, setRejectModalId] = useState<number | string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: returnsRes, isLoading } = useQuery({
    queryKey: ['returns', 'list'],
    queryFn: () => returnsService.getReturns(),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
      refundAmount,
    }: {
      id: number | string;
      status: ReturnStatus;
      reason?: string;
      refundAmount?: number;
    }) => returnsService.updateReturnStatus(id, status, reason, refundAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('تم تحديث حالة طلب المرتجع بنجاح');
      setRejectModalId(null);
      setRejectReason('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'تعذر تحديث حالة طلب المرتجع');
    },
  });

  const returns = returnsRes?.data ?? [];

  const counts = useMemo(() => {
    const base: Record<FilterStatus, number> = {
      all: 0,
      pending: 0,
      approved: 0,
      received: 0,
      rejected: 0,
    };
    returns.forEach((ret) => {
      base.all += 1;
      base[ret.status] += 1;
    });
    return base;
  }, [returns]);

  const filteredReturns =
    activeFilter === 'all' ? returns : returns.filter((ret) => ret.status === activeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          إدارة طلبات المرتجعات والاستبدال
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          مراجعة طلبات استرجاع الألعاب وفحص الحالة وبدء الاسترداد المالي
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === filter.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{filter.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] tabular-nums ${
                activeFilter === filter.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {counts[filter.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <EmptyState message="جارٍ تحميل طلبات المرتجعات..." icon={RotateCcw} />
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <EmptyState
              message={
                returns.length === 0
                  ? 'لا توجد طلبات مرتجعات حالياً'
                  : 'لا توجد طلبات مطابقة لهذا التصنيف'
              }
              description={
                returns.length === 0
                  ? 'ستظهر طلبات الاسترجاع الجديدة هنا.'
                  : 'جرّب اختيار تصنيف آخر لعرض الطلبات.'
              }
              icon={Inbox}
            />
          </div>
        ) : (
          filteredReturns.map((ret) => {
            const meta = STATUS_META[ret.status];
            const isMutating = statusMutation.isPending;

            return (
              <div
                key={ret.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm font-mono text-slate-900 dark:text-slate-100">
                          {ret.return_number}
                        </span>
                        <StatusBadge label={meta.label} variant={meta.variant} dot />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        الطلب الأصلي: {ret.order_number || '—'} · العميل: {ret.customer_name || '—'} ({ret.customer_phone || '—'})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        التاريخ: {formatDate(ret.created_at, isAr ? 'ar' : 'en')}
                        {ret.refund_amount > 0 && ` · قيمة الاسترداد: ${formatCurrency(ret.refund_amount)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {ret.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() =>
                            statusMutation.mutate({
                              id: ret.id,
                              status: 'approved',
                              refundAmount: ret.refund_amount,
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>قبول المرتجع</span>
                        </button>
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => setRejectModalId(ret.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>رفض</span>
                        </button>
                      </>
                    )}

                    {ret.status === 'approved' && (
                      <button
                        type="button"
                        disabled={isMutating}
                        onClick={() => statusMutation.mutate({ id: ret.id, status: 'received' })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>تأكيد استلام اللعبة بالمستودع</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-xs space-y-3">
                  {ret.items.length === 0 ? (
                    <EmptyState
                      message="لا توجد أصناف مسجلة لهذا الطلب"
                      description="الطلب مسجل بدون بيانات أصناف في الخادم."
                      icon={Inbox}
                      className="py-5"
                    />
                  ) : (
                    ret.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {localizedText(item.product_name, isAr ? 'ar' : 'en')}
                          </span>
                          <span className="text-slate-400 ms-2 font-mono">({item.sku})</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            سبب الإرجاع: {REASON_LABELS[item.reason] || item.reason} · الحالة:{' '}
                            {item.item_condition
                              ? CONDITION_LABELS[item.item_condition] || item.item_condition
                              : 'غير محددة'}
                            {item.customer_note && ` · ${item.customer_note}`}
                          </p>
                        </div>
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {item.quantity} × {formatCurrency(item.unit_price)} ={' '}
                          {formatCurrency(item.unit_price * item.quantity)}
                        </div>
                      </div>
                    ))
                  )}

                  {(ret.reason || ret.description) && (
                    <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                      {ret.reason && (
                        <span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">سبب الإرجاع:</span>{' '}
                          {ret.reason}
                        </span>
                      )}
                      {ret.description && (
                        <span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">التفاصيل:</span>{' '}
                          {ret.description}
                        </span>
                      )}
                      {ret.restock !== undefined && (
                        <span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">إعادة للمخزون:</span>{' '}
                          {ret.restock ? 'نعم' : 'لا'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {ret.rejection_reason && (
                  <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg">
                    سبب الرفض: {ret.rejection_reason}
                  </p>
                )}

                {!ret.rejection_reason && ret.admin_notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 dark:bg-slate-950 dark:text-slate-300 p-2.5 rounded-lg">
                    ملاحظات الإدارة: {ret.admin_notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {rejectModalId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              رفض طلب الاسترجاع
            </h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="اكتب سبب الرفض الموجه للعميل (مثل: تم فتح اللعبة وإتلاف تغليف المصنع)..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    id: rejectModalId,
                    status: 'rejected',
                    reason: rejectReason || 'مخالفة شروط سياسة الاسترجاع',
                  })
                }
                className="px-4 py-1.5 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsPage;
