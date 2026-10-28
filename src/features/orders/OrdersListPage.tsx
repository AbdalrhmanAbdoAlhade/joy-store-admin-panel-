import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  ShoppingCart,
  Eye,
  Plus,
  Truck,
  RotateCcw,
  CheckCircle,
  Clock,
  Printer,
} from 'lucide-react';
import { orderService } from '@/src/services/orderService';
import { Order, OrderStatus } from '@/src/types/order';
import DataTable from '@/src/components/tables/DataTable';
import StatusBadge, { BadgeVariant } from '@/src/components/common/StatusBadge';
import { toNumber } from '@/src/lib/api-helpers';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { toast } from 'sonner';

const getStatusBadge = (status: OrderStatus): { label: string; variant: BadgeVariant } => {
  switch (status) {
    case 'pending':
      return { label: 'قيد المراجعة', variant: 'warning' };
    case 'processing':
      return { label: 'جاري التجهيز', variant: 'info' };
    case 'shipped':
      return { label: 'تم الشحن', variant: 'info' };
    case 'delivered':
      return { label: 'تم التسليم', variant: 'success' };
    case 'cancelled':
      return { label: 'ملغي', variant: 'danger' };
    case 'returned':
      return { label: 'مرتجع', variant: 'purple' };
    default:
      return { label: status, variant: 'neutral' };
  }
};

export const OrdersListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [governorateFilter, setGovernorateFilter] = useState('all');

  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ['orders', 'list', page, pageSize, search, statusFilter, governorateFilter],
    queryFn: () =>
      orderService.getOrders({
        page: page + 1,
        per_page: pageSize,
        search,
        status: statusFilter,
        governorate: governorateFilter !== 'all' ? governorateFilter : undefined,
      }),
  });

  const orders = ordersRes?.data || [];
  const meta = ordersRes?.meta;

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'order_number',
      header: 'رقم الطلب',
      cell: ({ row }) => (
        <span
          onClick={() => navigate(`/orders/${row.original.id}`)}
          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          {row.original.order_number}
        </span>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'العميل والمحافظة',
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{o.customer_name}</p>
            <p className="text-[11px] text-slate-500 font-mono">
              {o.customer_phone} · {o.governorate}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'total',
      header: 'القيمة الإجمالية',
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(toNumber(o.total))}
            <p className="text-[10px] text-slate-400 font-sans">
              {o.payment_method === 'cod' ? 'دفع عند الاستلام' : 'دفع إلكتروني'}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'حالة الطلب',
      cell: ({ row }) => {
        const { label, variant } = getStatusBadge(row.original.status);
        return <StatusBadge label={label} variant={variant} dot />;
      },
    },
    {
      accessorKey: 'payment_status',
      header: 'حالة السداد',
      cell: ({ row }) => {
        const p = row.original.payment_status;
        return (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
              p === 'paid'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : p === 'refunded'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            {p === 'paid' ? 'مدفوع' : p === 'refunded' ? 'مسترد' : 'معلق'}
          </span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'تاريخ الإنشاء',
      cell: ({ row }) => (
        <span className="text-slate-500 text-[11px] font-mono tabular-nums">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/orders/${row.original.id}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>تفاصيل</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            إدارة طلبات ومبيعات الألعاب
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة مراحل الشحن والتسليم وتعيين بوالص التتبع لشركات الشحن
          </p>
        </div>

        <button
          onClick={() => navigate('/orders/create')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء طلب يدوي جديد</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <span className="text-xs text-slate-500 ms-1 me-2 font-medium">الحالة:</span>
        {[
          { key: 'all', label: 'الكل' },
          { key: 'pending', label: 'قيد المراجعة' },
          { key: 'processing', label: 'جاري التجهيز' },
          { key: 'shipped', label: 'تم الشحن' },
          { key: 'delivered', label: 'تم التسليم' },
          { key: 'returned', label: 'مرتجع' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setStatusFilter(item.key);
              setPage(0);
            }}
            className={`px-3 py-1 rounded-md text-xs transition-colors ${
              statusFilter === item.key
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}

        <div className="ms-auto flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">المحافظة:</span>
          <select
            value={governorateFilter}
            onChange={(e) => {
              setGovernorateFilter(e.target.value);
              setPage(0);
            }}
            className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-md outline-hidden text-slate-700 dark:text-slate-200"
          >
            <option value="all">كل المحافظات</option>
            <option value="القاهرة">القاهرة</option>
            <option value="الجيزة">الجيزة</option>
            <option value="الإسكندرية">الإسكندرية</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={orders}
        totalRows={meta?.total || orders.length}
        pageCount={meta?.last_page || 1}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
        onSearch={(s) => {
          setSearch(s);
          setPage(0);
        }}
        searchValue={search}
        searchPlaceholder="البحث برقم الطلب، اسم العميل أو الهاتف..."
        isLoading={isLoading}
      />
    </div>
  );
};

export default OrdersListPage;
