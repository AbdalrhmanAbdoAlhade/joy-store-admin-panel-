import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Star, Check, X, Eye, ShieldCheck, Clock } from 'lucide-react';
import { reviewService } from '@/src/services/reviewService';
import { Review, ReviewStatus } from '@/src/types/review';
import DataTable from '@/src/components/tables/DataTable';
import StatusBadge from '@/src/components/common/StatusBadge';
import { formatDate } from '@/src/lib/utils';
import { toast } from 'sonner';

const PER_PAGE = 10;

const TABS: { key: ReviewStatus; ar: string; en: string }[] = [
  { key: 'pending', ar: 'بانتظار المراجعة', en: 'Pending' },
  { key: 'approved', ar: 'مقبولة', en: 'Approved' },
  { key: 'rejected', ar: 'مرفوضة', en: 'Rejected' },
];

const EMPTY_TEXT: Record<ReviewStatus, { ar: string; en: string }> = {
  pending: {
    ar: 'لا توجد تقييمات بانتظار المراجعة حاليًا.',
    en: 'There are no reviews pending moderation.',
  },
  approved: {
    ar: 'لا توجد تقييمات مقبولة بعد.',
    en: 'There are no approved reviews yet.',
  },
  rejected: {
    ar: 'لا توجد تقييمات مرفوضة.',
    en: 'There are no rejected reviews.',
  },
};

const RatingStars: React.FC<{ value: number }> = ({ value }) => (
  <div className="flex items-center gap-0.5" title={`${value} / 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${
          i < value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
        }`}
      />
    ))}
    <span className="ms-1 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
      {value}/5
    </span>
  </div>
);

const statusBadge = (status: ReviewStatus, isAr: boolean) => {
  if (status === 'approved') {
    return <StatusBadge label={isAr ? 'مقبول' : 'Approved'} variant="success" dot />;
  }
  if (status === 'rejected') {
    return <StatusBadge label={isAr ? 'مرفوض' : 'Rejected'} variant="danger" dot />;
  }
  return <StatusBadge label={isAr ? 'بانتظار المراجعة' : 'Pending'} variant="warning" dot />;
};

export const ReviewsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PER_PAGE);
  const [detail, setDetail] = useState<Review | null>(null);

  const { data: listRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['reviews', 'list', status, page, pageSize],
    queryFn: () =>
      reviewService.getReviews({ status, page: page + 1, per_page: pageSize }),
  });

  const { data: counts } = useQuery({
    queryKey: ['reviews', 'counts'],
    queryFn: async () => {
      const [pending, approved, rejected] = await Promise.all([
        reviewService.getReviews({ status: 'pending', page: 1, per_page: 1 }),
        reviewService.getReviews({ status: 'approved', page: 1, per_page: 1 }),
        reviewService.getReviews({ status: 'rejected', page: 1, per_page: 1 }),
      ]);
      return {
        pending: pending.meta?.total ?? 0,
        approved: approved.meta?.total ?? 0,
        rejected: rejected.meta?.total ?? 0,
      };
    },
  });

  const moderation = useMutation({
    mutationFn: ({ id, target }: { id: number | string; target: 'approved' | 'rejected' }) =>
      target === 'approved'
        ? reviewService.approveReview(id)
        : reviewService.rejectReview(id),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success(
        vars.target === 'approved'
          ? isAr ? 'تم قبول التقييم' : 'Review approved'
          : isAr ? 'تم رفض التقييم' : 'Review rejected'
      );
      setDetail(null);
    },
  });

  const reviews = listRes?.data || [];
  const meta = listRes?.meta;

  const columns: ColumnDef<Review>[] = [
    {
      accessorKey: 'product_id',
      header: isAr ? 'المنتج' : 'Product',
      cell: ({ row }) => (
        <div className="max-w-[180px]">
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {row.original.product?.name || '—'}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">#{row.original.product_id}</p>
        </div>
      ),
    },
    {
      accessorKey: 'user_id',
      header: isAr ? 'المستخدم' : 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
            {(row.original.user?.name || '?').charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {row.original.user?.name || '—'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">#{row.original.user_id ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: isAr ? 'التقييم' : 'Rating',
      cell: ({ row }) => <RatingStars value={row.original.rating} />,
    },
    {
      accessorKey: 'body',
      header: isAr ? 'التعليق' : 'Comment',
      cell: ({ row }) => (
        <div className="max-w-[260px]">
          {row.original.title && (
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {row.original.title}
            </p>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
            {row.original.body || '—'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: isAr ? 'الحالة' : 'Status',
      cell: ({ row }) => statusBadge(row.original.status, isAr),
    },
    {
      accessorKey: 'created_at',
      header: isAr ? 'التاريخ' : 'Date',
      cell: ({ row }) => (
        <span className="text-slate-400 text-[11px] font-mono tabular-nums">
          {row.original.created_at ? formatDate(row.original.created_at) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      cell: ({ row }) => {
        const r = row.original;
        const busy = moderation.isPending && String(moderation.variables?.id) === String(r.id);
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDetail(r)}
              title={isAr ? 'عرض التفاصيل' : 'View details'}
              className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Eye className="w-4 h-4" />
            </button>

            {r.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={() => moderation.mutate({ id: r.id, target: 'approved' })}
                  disabled={moderation.isPending}
                  title={isAr ? 'قبول' : 'Approve'}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg disabled:opacity-40"
                >
                  {busy && moderation.variables?.target === 'approved' ? (
                    <span className="block w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => moderation.mutate({ id: r.id, target: 'rejected' })}
                  disabled={moderation.isPending}
                  title={isAr ? 'رفض' : 'Reject'}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-40"
                >
                  {busy && moderation.variables?.target === 'rejected' ? (
                    <span className="block w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const tabLabel = (tab: (typeof TABS)[number]) => (isAr ? tab.ar : tab.en);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {isAr ? 'التقييمات (Reviews)' : 'Reviews'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isAr
            ? 'مراجعة تقييمات أولياء الأمور وقبولها أو رفضها قبل نشرها على صفحة اللعبة'
            : 'Moderate customer reviews: approve or reject them before they appear on the product page'}
        </p>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-fit">
        {TABS.map((tab) => {
          const active = status === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatus(tab.key);
                setPage(0);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                active
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span>{tabLabel(tab)}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {counts?.[tab.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <DataTable
          columns={columns}
          data={reviews}
          totalRows={meta?.total || reviews.length}
          pageCount={meta?.last_page || 1}
          pageIndex={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          isLoading={isLoading}
          emptyTitle={
            isError
              ? isAr ? 'تعذر تحميل التقييمات' : 'Failed to load reviews'
              : isAr ? 'لا توجد تقييمات' : 'No reviews'
          }
          emptyDescription={
            isError
              ? isAr
                ? 'حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.'
                : 'Something went wrong while contacting the server. Please try again.'
              : EMPTY_TEXT[status][isAr ? 'ar' : 'en']
          }
          emptyAction={
            isError ? (
              <button
                type="button"
                onClick={() => refetch()}
                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                {isAr ? 'إعادة المحاولة' : 'Retry'}
              </button>
            ) : undefined
          }
        />
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">
                  {isAr ? 'تفاصيل التقييم' : 'Review details'}
                </p>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {detail.product?.name || '—'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  #{detail.product_id} · {isAr ? 'تقييم' : 'Review'} #{detail.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center">
                  {(detail.user?.name || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {detail.user?.name || '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {isAr ? 'مستخدم' : 'User'} #{detail.user_id ?? '—'}
                  </p>
                </div>
              </div>
              {detail.is_verified_purchase && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  {isAr ? 'شراء موثّق' : 'Verified purchase'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <RatingStars value={detail.rating} />
              {statusBadge(detail.status, isAr)}
            </div>

            {detail.title && (
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{detail.title}</p>
            )}

            <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg whitespace-pre-line">
              {detail.body || '—'}
            </p>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950">
                <p className="text-slate-400 mb-0.5">{isAr ? 'رقم الطلب' : 'Order'}</p>
                <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {detail.order_id != null ? `#${detail.order_id}` : '—'}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950">
                <p className="text-slate-400 mb-0.5">{isAr ? 'تاريخ الإرسال' : 'Submitted'}</p>
                <p className="font-mono font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {detail.created_at ? formatDate(detail.created_at) : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="px-4 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              {detail.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => moderation.mutate({ id: detail.id, target: 'rejected' })}
                    disabled={moderation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 font-bold text-red-600 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    {isAr ? 'رفض' : 'Reject'}
                  </button>
                  <button
                    type="button"
                    onClick={() => moderation.mutate({ id: detail.id, target: 'approved' })}
                    disabled={moderation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isAr ? 'قبول ونشر' : 'Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
