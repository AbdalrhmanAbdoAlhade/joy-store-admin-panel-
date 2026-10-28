import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { CreditCard, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';
import { paymentService } from '@/src/services/paymentService';
import { Transaction } from '@/src/types/payment';
import DataTable from '@/src/components/tables/DataTable';
import StatusBadge from '@/src/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/src/lib/utils';

export const TransactionsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const { data: transactionsRes, isLoading } = useQuery({
    queryKey: ['payments', 'transactions', page, pageSize, search],
    queryFn: () => paymentService.getTransactions({ page: page + 1, per_page: pageSize, search }),
  });

  const transactions = transactionsRes?.data || [];
  const meta = transactionsRes?.meta;

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'transaction_number',
      header: 'رقم المعاملة',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
          {row.original.transaction_number}
        </span>
      ),
    },
    {
      accessorKey: 'order_number',
      header: 'الطلب والعميل',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-blue-600 font-bold">{row.original.order_number}</span>
          <p className="text-[11px] text-slate-500">{row.original.customer_name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'gateway',
      header: 'البوابة / الطريقة',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.original.gateway}
          </span>
          {row.original.payment_method_type && (
            <p className="text-[10px] text-slate-400 font-mono">{row.original.payment_method_type}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'المبلغ',
      cell: ({ row }) => (
        <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
          {formatCurrency(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <StatusBadge
            label={
              s === 'success'
                ? 'ناجحة'
                : s === 'failed'
                ? 'فاشلة'
                : s === 'refunded'
                ? 'مستردة'
                : 'معلقة'
            }
            variant={
              s === 'success'
                ? 'success'
                : s === 'failed'
                ? 'danger'
                : s === 'refunded'
                ? 'purple'
                : 'warning'
            }
            dot
          />
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'التاريخ',
      cell: ({ row }) => (
        <span className="text-slate-500 text-[11px] font-mono tabular-nums">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          سجل المعاملات والمدفوعات
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          سجل تفصيلي لعمليات التحصيل الإلكتروني، أرقام المراجع البنكية وحالات السداد
        </p>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        totalRows={meta?.total || transactions.length}
        pageCount={meta?.last_page || 1}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="البحث برقم المعاملة أو الطلب..."
        isLoading={isLoading}
      />
    </div>
  );
};

export default TransactionsPage;
