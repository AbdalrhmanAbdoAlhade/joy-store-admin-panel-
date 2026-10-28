import React, { useEffect, useRef, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  SlidersHorizontal,
  Search,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalRows?: number;
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (search: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  onExportCsv?: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalRows = 0,
  pageCount = 1,
  pageIndex = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onSearch,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'بحث في الجدول...',
  isLoading = false,
  emptyTitle = 'لا توجد بيانات متاحة',
  emptyDescription = 'لم يتم العثور على أي عناصر تطابق معايير البحث الحالية.',
  emptyAction,
  bulkActions,
  onExportCsv,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const lastEmittedSearch = useRef(searchValue);

  useEffect(() => {
    if (searchValue === undefined) return;
    setLocalSearch(searchValue);
    lastEmittedSearch.current = searchValue;
  }, [searchValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch === lastEmittedSearch.current) return;
      lastEmittedSearch.current = localSearch;
      (onSearchChange ?? onSearch)?.(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearch, onSearchChange]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        {(onSearch || onSearchChange) && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full ps-9 pe-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        )}

        {/* Action buttons: Columns Visibility + Export */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Column Visibility */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>الأعمدة</span>
            </button>

            {showColumnsMenu && (
              <div
                className="absolute end-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-2 z-30 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowColumnsMenu(false)}
              >
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 mb-1 border-b border-slate-100 dark:border-slate-800">
                  إظهار / إخفاء الأعمدة
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {table
                    .getAllLeafColumns()
                    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                    .map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="capitalize">{column.id}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Export to CSV */}
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedRows.length > 0 && bulkActions && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-900 dark:text-blue-200">
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>تم تحديد {selectedRows.length} عنصر</span>
          </div>
          <div className="flex items-center gap-2">{bulkActions(selectedRows)}</div>
        </div>
      )}

      {/* Table Container */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 select-none">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 font-semibold text-start whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            'flex items-center gap-1.5',
                            header.column.getCanSort() && 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-100'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={cIdx} className="px-4 py-3.5">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-sm w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors',
                      row.getIsSelected() && 'bg-blue-50/40 dark:bg-blue-950/20'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-slate-700 dark:text-slate-300 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        {emptyTitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        {emptyDescription}
                      </p>
                      {emptyAction}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              إجمالي النتائج: <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{totalRows}</strong>
            </span>
            {onPageSizeChange && (
              <div className="flex items-center gap-1.5">
                <span>عرض:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs outline-hidden"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {onPageChange && (
            <div className="flex items-center gap-2">
              <span className="font-mono tabular-nums">
                صفحة {pageIndex + 1} من {Math.max(1, pageCount)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pageIndex <= 0 || isLoading}
                  onClick={() => onPageChange(pageIndex - 1)}
                  className="p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  disabled={pageIndex >= pageCount - 1 || isLoading}
                  onClick={() => onPageChange(pageIndex + 1)}
                  className="p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataTable;
