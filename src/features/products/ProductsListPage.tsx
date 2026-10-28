import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Layers,
  AlertCircle,
  Eye,
  CheckCircle2,
  Archive,
  Image as ImageIcon,
} from 'lucide-react';
import { productService } from '@/src/services/productService';
import { taxonomyService } from '@/src/services/taxonomyService';
import { Product } from '@/src/types/product';
import DataTable from '@/src/components/tables/DataTable';
import StatusBadge from '@/src/components/common/StatusBadge';
import ConfirmDialog from '@/src/components/common/ConfirmDialog';
import { formatCurrency } from '@/src/lib/utils';
import { localizedText } from '@/src/lib/api-helpers';
import { toast } from 'sonner';

export const ProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  // Filters & State
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<number | string | null>(null);

  const search = searchParams.get('search') || '';

  const handleSearchChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('search', value);
    else next.delete('search');
    setSearchParams(next, { replace: true });
    setPage(0);
  };

  // Queries
  const { data: categoriesRes } = useQuery({
    queryKey: ['taxonomy', 'categories'],
    queryFn: () => taxonomyService.getCategories(),
  });

  const { data: productsRes, isLoading } = useQuery({
    queryKey: ['products', 'list', page, pageSize, search, statusFilter, categoryFilter],
    queryFn: () =>
      productService.getProducts({
        page: page + 1,
        per_page: pageSize,
        search,
        status: statusFilter,
        category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
      }),
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم حذف اللعبة بنجاح من الكتالوج');
      setDeleteId(null);
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: (number | string)[]; status: string }) =>
      productService.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث حالة المنتجات المحددة');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: (number | string)[]) => productService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم حذف المنتجات المحددة');
    },
  });

  const products = productsRes?.data || [];
  const meta = productsRes?.meta;
  const categories = categoriesRes?.data || [];

  // Table Columns Definition
  const columns: ColumnDef<Product>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'اللعبة والمنتج',
      cell: ({ row }) => {
        const p = row.original;
        const img = p.images?.[0]?.url;
        return (
          <div className="flex items-center gap-3 min-w-[220px]">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {img ? (
                <img
                  src={img}
                  alt={localizedText(p.name)}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-xs">
                {localizedText(p.name, isAr ? 'ar' : 'en')}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                <span>{p.sku}</span>
                {p.toy_details?.choking_hazard && (
                  <span className="text-red-500 text-[10px]" title="خطر الاختناق - قطع صغيرة">
                    ⚠️ قطع صغيرة
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'السعر والتكلفة',
      cell: ({ row }) => {
        const p = row.original;
        const hasDiscount = p.discount_price && p.discount_price < p.price;
        return (
          <div className="text-start whitespace-nowrap">
            {hasDiscount ? (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {formatCurrency(p.discount_price!)}
                </span>
                <span className="line-through text-slate-400 text-[11px] font-mono tabular-nums">
                  {formatCurrency(p.price)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {formatCurrency(p.price)}
              </span>
            )}
            <p className="text-[10px] text-slate-400">التكلفة: {formatCurrency(p.cost_price)}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'stock',
      header: 'المخزون',
      cell: ({ row }) => {
        const p = row.original;
        const isLowStock = p.stock <= p.low_stock_threshold;
        const isOutOfStock = p.stock === 0;

        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className={`font-mono font-bold tabular-nums text-xs ${
                isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {p.stock} قطعة
            </span>
            {isOutOfStock && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-100 text-red-700">نفد</span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-700">منخفض</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <StatusBadge
            label={s === 'active' ? 'نشط' : s === 'draft' ? 'مسودة' : 'مؤرشف'}
            variant={s === 'active' ? 'success' : s === 'draft' ? 'warning' : 'neutral'}
            dot
          />
        );
      },
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate(`/products/${p.id}/edit`)}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="تعديل"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteId(p.id)}
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 transition-colors"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            كتالوج ألعاب الأطفال
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة منتجات الألعاب، المواصفات الفنية، شروط الأمان والمخزون
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/products/create')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة لعبة جديدة</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 ms-1 me-2 font-medium">الحالة:</span>
          {['all', 'active', 'draft', 'archived'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(0);
              }}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'الكل' : st === 'active' ? 'نشط' : st === 'draft' ? 'مسودة' : 'مؤرشف'}
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Category select filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">القسم:</span>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-md outline-hidden text-slate-700 dark:text-slate-200"
          >
            <option value="all">كل الأقسام</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {localizedText(c.name, isAr ? 'ar' : 'en')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={products}
        totalRows={meta?.total || products.length}
        pageCount={meta?.last_page || 1}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(0);
        }}
        onSearchChange={handleSearchChange}
        searchValue={search}
        searchPlaceholder="البحث بالاسم، الكود (SKU)، أو الباركود..."
        isLoading={isLoading}
        emptyTitle="لم يتم العثور على ألعاب"
        emptyDescription="حاول تغيير كلمة البحث أو فلاتر الحالة والأقسام."
        emptyAction={
          <button
            onClick={() => navigate('/products/create')}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            إضافة لعبة جديدة
          </button>
        }
        bulkActions={(selected) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => bulkStatusMutation.mutate({ ids: selected.map((s) => s.id), status: 'active' })}
              className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-emerald-50"
            >
              تفعيل المحددة
            </button>
            <button
              onClick={() => bulkStatusMutation.mutate({ ids: selected.map((s) => s.id), status: 'archived' })}
              className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50"
            >
              أرشفة
            </button>
            <button
              onClick={() => bulkDeleteMutation.mutate(selected.map((s) => s.id))}
              className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              حذف
            </button>
          </div>
        )}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="تأكيد حذف اللعبة"
        description="هل أنت متأكد من حذف هذه اللعبة نهائياً من الكتالوج؟ ستتم إزالتها من المتجر وتجميد حركات المخزون المرتبطة بها."
        confirmLabel="حذف نهائي"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};

export default ProductsListPage;
