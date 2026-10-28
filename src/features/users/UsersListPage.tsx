import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Users, Ban, CheckCircle, Award } from 'lucide-react';
import { customerService } from '@/src/services/customerService';
import { CustomerUser } from '@/src/types/customer';
import DataTable from '@/src/components/tables/DataTable';
import StatusBadge from '@/src/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { toast } from 'sonner';

export const UsersListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['customers', 'list', page, pageSize, search],
    queryFn: () => customerService.getUsers({ page: page + 1, per_page: pageSize, search }),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: 'active' | 'banned' }) =>
      customerService.toggleUserBan(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم تحديث حالة حساب العميل');
    },
  });

  const users = usersRes?.data || [];
  const meta = usersRes?.meta;

  const columns: ColumnDef<CustomerUser>[] = [
    {
      accessorKey: 'name',
      header: 'العميل (ولي الأمر)',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
            {row.original.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{row.original.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'الهاتف',
      cell: ({ row }) => (
        <p dir="ltr" className="text-xs font-mono text-slate-800 dark:text-slate-200">
          {row.original.phone || 'غير مسجل'}
        </p>
      ),
    },
    {
      accessorKey: 'roles',
      header: 'الأدوار',
      cell: ({ row }) => {
        const roles = row.original.roles || [];
        return (
          <div className="flex flex-wrap gap-1">
            {roles.length === 0 ? (
              <span className="text-[11px] text-slate-400">—</span>
            ) : (
              roles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  {role}
                </span>
              ))
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'loyalty_points',
      header: 'نقاط الولاء',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-mono font-bold">
          <Award className="w-3.5 h-3.5" />
          <span>{row.original.loyalty_points} نقطة</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => (
        <StatusBadge
          label={row.original.status === 'active' ? 'نشط' : 'محظور'}
          variant={row.original.status === 'active' ? 'success' : 'danger'}
          dot
        />
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'تاريخ التسجيل',
      cell: ({ row }) => (
        <span className="text-slate-400 text-[11px] font-mono tabular-nums">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }) => {
        const u = row.original;
        const isActive = u.status === 'active';
        return (
          <button
            onClick={() => banMutation.mutate({ id: u.id, status: isActive ? 'banned' : 'active' })}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              isActive
                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            {isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
            <span>{isActive ? 'حظر الحساب' : 'إلغاء الحظر'}</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          قائمة العملاء وأولياء الأمور
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          متابعة العملاء المسجلين، إجمالي مشترياتهم، أرصدة نقاط الولاء وإمكانية إدارة حالة الحساب
        </p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        totalRows={meta?.total || users.length}
        pageCount={meta?.last_page || 1}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="البحث باسم العميل، البريد أو الهاتف..."
        isLoading={isLoading}
      />
    </div>
  );
};

export default UsersListPage;
