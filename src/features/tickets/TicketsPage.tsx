import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { ticketService } from '@/src/services/ticketService';
import type { Ticket, TicketStatus } from '@/src/types/ticket';
import DataTable from '@/src/components/tables/DataTable';
import StatusBadge from '@/src/components/common/StatusBadge';
import TicketDetailsModal from '@/src/features/tickets/TicketDetailsModal';
import { formatDate } from '@/src/lib/utils';

const PER_PAGE = 10;

const TABS: { key: TicketStatus; ar: string; en: string }[] = [
  { key: 'open', ar: 'مفتوحة', en: 'Open' },
  { key: 'in_progress', ar: 'قيد التنفيذ', en: 'In progress' },
  { key: 'waiting_customer', ar: 'بانتظار العميل', en: 'Waiting customer' },
  { key: 'resolved', ar: 'محلولة', en: 'Resolved' },
  { key: 'closed', ar: 'مغلقة', en: 'Closed' },
];

const PRIORITY_STYLES: Record<string, { ar: string; en: string; cls: string }> = {
  low: { ar: 'منخفضة', en: 'Low', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  medium: { ar: 'متوسطة', en: 'Medium', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300' },
  high: { ar: 'عالية', en: 'High', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300' },
  urgent: { ar: 'عاجلة', en: 'Urgent', cls: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300' },
};

const statusBadge = (status: TicketStatus, isAr: boolean) => {
  switch (status) {
    case 'resolved':
      return <StatusBadge label={isAr ? 'محلولة' : 'Resolved'} variant="success" dot />;
    case 'closed':
      return <StatusBadge label={isAr ? 'مغلقة' : 'Closed'} variant="neutral" dot />;
    case 'waiting_customer':
      return <StatusBadge label={isAr ? 'بانتظار العميل' : 'Waiting customer'} variant="purple" dot />;
    case 'in_progress':
      return <StatusBadge label={isAr ? 'قيد التنفيذ' : 'In progress'} variant="info" dot />;
    default:
      return <StatusBadge label={isAr ? 'مفتوحة' : 'Open'} variant="warning" dot />;
  }
};

export const TicketsPage: React.FC = () => {
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const [status, setStatus] = useState<TicketStatus>('open');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PER_PAGE);
  const [openId, setOpenId] = useState<number | string | null>(null);

  const { data: listRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['tickets', 'list', status, page, pageSize],
    queryFn: () => ticketService.getTickets({ status, page: page + 1, per_page: pageSize }),
  });

  const { data: counts } = useQuery({
    queryKey: ['tickets', 'counts'],
    queryFn: async () => {
      const results = await Promise.all(
        TABS.map((tab) => ticketService.getTickets({ status: tab.key, page: 1, per_page: 1 }))
      );
      return TABS.reduce((acc, tab, i) => {
        acc[tab.key] = results[i].meta.total;
        return acc;
      }, {} as Record<TicketStatus, number>);
    },
  });

  const tickets = listRes?.items || [];
  const meta = listRes?.meta;

  const columns: ColumnDef<Ticket>[] = [
    {
      accessorKey: 'ticket_number',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
          {row.original.ticket_number || `#${row.original.id}`}
        </span>
      ),
    },
    {
      accessorKey: 'subject',
      header: isAr ? 'الموضوع' : 'Subject',
      cell: ({ row }) => (
        <div className="max-w-[240px]">
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {row.original.subject}
          </p>
          {row.original.order_id != null && (
            <p className="text-[10px] text-slate-400 font-mono">
              {isAr ? 'طلب' : 'Order'} #{row.original.order_id}
            </p>
          )}
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
            {row.original.user?.email && (
              <p className="text-[10px] text-slate-400 font-mono truncate">{row.original.user.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: isAr ? 'الأولوية' : 'Priority',
      cell: ({ row }) => {
        const p = PRIORITY_STYLES[row.original.priority || 'medium'] || PRIORITY_STYLES.medium;
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.cls}`}>
            {isAr ? p.ar : p.en}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: isAr ? 'الحالة' : 'Status',
      cell: ({ row }) => statusBadge(row.original.status, isAr),
    },
    {
      accessorKey: 'messages_count',
      header: isAr ? 'الردود' : 'Replies',
      cell: ({ row }) =>
        row.original.messages_count != null ? (
          <span className="font-mono text-slate-600 dark:text-slate-300">{row.original.messages_count}</span>
        ) : (
          <span className="text-slate-300 dark:text-slate-600">—</span>
        ),
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
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setOpenId(row.original.id)}
          title={isAr ? 'عرض التفاصيل' : 'View details'}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isAr ? 'عرض' : 'View'}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {isAr ? 'الدعم الفني' : 'Support'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isAr
            ? 'متابعة تذاكر واستفسارات العملاء، الرد عليها وتعيينها للموظفين'
            : 'Track customer tickets, reply to them and assign them to staff'}
        </p>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-fit flex-wrap">
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
              <span>{isAr ? tab.ar : tab.en}</span>
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
          data={tickets}
          totalRows={meta?.total || tickets.length}
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
              ? isAr ? 'تعذر تحميل التذاكر' : 'Failed to load tickets'
              : isAr ? 'لا توجد تذاكر' : 'No tickets'
          }
          emptyDescription={
            isError
              ? isAr
                ? 'حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.'
                : 'Something went wrong while contacting the server. Please try again.'
              : isAr
                ? 'لا توجد تذاكر في هذه الحالة حاليًا.'
                : 'There are no tickets with this status.'
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

      {openId != null && (
        <TicketDetailsModal ticketId={openId} isAr={isAr} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
};

export default TicketsPage;
