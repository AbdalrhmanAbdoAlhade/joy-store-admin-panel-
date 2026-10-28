import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  AlertTriangle,
  History,
  Boxes,
} from 'lucide-react';
import { inventoryService } from '@/src/services/inventoryService';
import { StockAdjustmentPayload, LowStockItem } from '@/src/types/inventory';
import { localizedText } from '@/src/lib/api-helpers';
import { formatDate } from '@/src/lib/utils';
import EmptyState from '@/src/components/common/EmptyState';
import { toast } from 'sonner';

type InventoryTab = 'inventory' | 'movements' | 'low_stock';

const createEmptyAdjustment = (): StockAdjustmentPayload => ({
  product_id: '',
  variant_id: '',
  type: 'increment',
  quantity: 1,
  reason: '',
  notes: '',
});

const movementLabel = (type: string) => {
  switch (type) {
    case 'purchase':
    case 'in':
      return 'توريد وارد';
    case 'sale':
    case 'out':
      return 'صرف مبيعات';
    case 'return':
      return 'مرتجع';
    case 'loss':
      return 'فقد';
    case 'damage':
      return 'تلف';
    default:
      return 'تسوية جردية';
  }
};

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';
  const [activeTab, setActiveTab] = useState<InventoryTab>('inventory');
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [adjPayload, setAdjPayload] = useState<StockAdjustmentPayload>(createEmptyAdjustment);

  const { data: inventoryRes, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory', 'items'],
    queryFn: () => inventoryService.getInventoryItems(),
  });

  const { data: lowStockRes, isLoading: lowStockLoading } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryService.getLowStockItems(),
  });

  const inventoryItems = inventoryRes?.data ?? [];
  const lowStockItems = lowStockRes?.data ?? [];
  const effectiveSelectedId =
    selectedInventoryId || (inventoryItems[0] ? String(inventoryItems[0].id) : '');
  const selectedItem = inventoryItems.find((item) => String(item.id) === effectiveSelectedId);

  const { data: movementsRes, isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory', 'movements', effectiveSelectedId],
    queryFn: () => inventoryService.getStockMovements(effectiveSelectedId),
    enabled: Boolean(effectiveSelectedId),
  });

  const movements = movementsRes?.data ?? [];
  const totalUnits = inventoryItems.reduce((sum, item) => sum + item.stock, 0);

  const adjustMutation = useMutation({
    mutationFn: (payload: StockAdjustmentPayload) => inventoryService.adjustStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('تمت تسوية رصيد المخزن بنجاح وتوثيق الحركة بالسجل');
      setModalOpen(false);
      setAdjPayload(createEmptyAdjustment());
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'تعذر تنفيذ تسوية المخزون، حاول مرة أخرى');
    },
  });

  const openAdjustment = (item?: LowStockItem, reason = '') => {
    setAdjPayload(
      item
        ? {
            product_id: item.product_id ?? item.id,
            variant_id: item.id,
            type: 'increment',
            quantity: Math.max(item.reorder_suggested_qty || 1, 1),
            reason,
            notes: '',
          }
        : createEmptyAdjustment()
    );
    setModalOpen(true);
  };

  const handleInventorySelect = (value: string) => {
    const item = inventoryItems.find((row) => String(row.id) === value);
    setAdjPayload({
      ...adjPayload,
      variant_id: item?.id ?? '',
      product_id: item?.product_id ?? item?.id ?? '',
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjPayload.variant_id && !adjPayload.product_id) {
      toast.error('يرجى اختيار اللعبة المراد تسوية رصيدها');
      return;
    }
    if (!adjPayload.reason.trim()) {
      toast.error('يرجى كتابة سبب التسوية (مثل: جرد سنوي، تلف علبة، توريد عاجل)');
      return;
    }
    adjustMutation.mutate(adjPayload);
  };

  const viewMovements = (item: LowStockItem) => {
    setSelectedInventoryId(String(item.id));
    setActiveTab('movements');
  };

  const stockBadge = (item: LowStockItem) => {
    if (item.stock <= 0) {
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">نفد</span>;
    }
    if (item.stock <= item.low_stock_threshold) {
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">منخفض</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">متوفر</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            إدارة المخزون والتسويات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            أرصدة جميع الأصناف، سجل حركات المخزن، تسوية النواقص وتنبيهات إعادة الطلب
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAdjustment()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Sliders className="w-4 h-4" />
          <span>تسوية مخزون يدوية</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">إجمالي الأصناف بالمخزن</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {inventoryItems.length} صنف
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">ألعاب أوشكت على النفاد</p>
          <p className="text-xl font-bold font-mono tabular-nums text-amber-600 mt-1">
            {lowStockItems.length} ألعاب
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">إجمالي القطع المتاحة</p>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
            {totalUnits} قطعة
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>أرصدة المخزون ({inventoryItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'movements'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل حركات المخزن (Movements Log)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('low_stock')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'low_stock'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>تقرير النواقص ({lowStockItems.length})</span>
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          {inventoryLoading ? (
            <EmptyState message="جارٍ تحميل أرصدة المخزون..." icon={Archive} />
          ) : inventoryItems.length === 0 ? (
            <EmptyState
              message="لا توجد أصناف في المخزون"
              description="ستظهر الأصناف هنا بعد إضافتها إلى الكتالوج."
              icon={Archive}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-start">اللعبة / SKU</th>
                    <th className="px-4 py-3 text-start">المتغير</th>
                    <th className="px-4 py-3 text-start">الرصيد</th>
                    <th className="px-4 py-3 text-start">حد الأمان</th>
                    <th className="px-4 py-3 text-start">الحالة</th>
                    <th className="px-4 py-3 text-end">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inventoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {localizedText(item.product_name, isAr ? 'ar' : 'en')}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{item.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.variant_name || 'افتراضي'}</td>
                      <td className="px-4 py-3 font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {item.stock}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{item.low_stock_threshold}</td>
                      <td className="px-4 py-3">{stockBadge(item)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => viewMovements(item)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          >
                            الحركات
                          </button>
                          <button
                            type="button"
                            onClick={() => openAdjustment(item)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                          >
                            تسوية
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">حركات الصنف المحدد</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedItem
                  ? `${localizedText(selectedItem.product_name, isAr ? 'ar' : 'en')} · ${selectedItem.sku}`
                  : 'اختر صنفاً لعرض سجل حركاته'}
              </p>
            </div>
            <select
              value={effectiveSelectedId}
              onChange={(e) => setSelectedInventoryId(e.target.value)}
              disabled={inventoryItems.length === 0}
              className="w-full sm:w-80 px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden disabled:opacity-50"
            >
              {inventoryItems.length === 0 && <option value="">لا توجد أصناف</option>}
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {localizedText(item.product_name, isAr ? 'ar' : 'en')} ({item.sku}) - الرصيد: {item.stock}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            {movementsLoading ? (
              <EmptyState message="جارٍ تحميل حركات المخزن..." icon={History} />
            ) : movements.length === 0 ? (
              <EmptyState
                message="لا توجد حركات مسجلة لهذا الصنف"
                description="ستظهر حركات التوريد والصرف والتسويات هنا عند حدوثها."
                icon={History}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-start">المنتج / SKU</th>
                      <th className="px-4 py-3 text-start">نوع الحركة</th>
                      <th className="px-4 py-3 text-start">الكمية</th>
                      <th className="px-4 py-3 text-start">قبل / بعد</th>
                      <th className="px-4 py-3 text-start">السبب والمرجع</th>
                      <th className="px-4 py-3 text-start">المنفّذ والتاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {movements.map((m) => {
                      const isPositive = m.quantity > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {localizedText(m.product_name, isAr ? 'ar' : 'en') ||
                                (selectedItem
                                  ? localizedText(selectedItem.product_name, isAr ? 'ar' : 'en')
                                  : '—')}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {m.sku || selectedItem?.sku || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                m.type === 'in' || m.type === 'purchase'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : m.type === 'out' || m.type === 'sale'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              }`}
                            >
                              {(m.type === 'in' || m.type === 'purchase') && (
                                <ArrowDownLeft className="w-3 h-3" />
                              )}
                              {(m.type === 'out' || m.type === 'sale') && (
                                <ArrowUpRight className="w-3 h-3" />
                              )}
                              <span>{movementLabel(m.type)}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold tabular-nums">
                            <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                              {isPositive ? `+${m.quantity}` : m.quantity} قطعة
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 tabular-nums">
                            {m.stock_before} ➔ {m.stock_after}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-slate-800 dark:text-slate-200">{m.reason}</p>
                            {m.reference_id && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                مرجع: {m.reference_id}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                              {m.performed_by}
                            </p>
                            <p className="text-[10px] text-slate-400">{formatDate(m.created_at)}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'low_stock' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          {lowStockLoading ? (
            <EmptyState message="جارٍ تحميل تقرير النواقص..." icon={AlertTriangle} />
          ) : lowStockItems.length === 0 ? (
            <EmptyState
              message="لا توجد ألعاب منخفضة المخزون حالياً"
              description="جميع الأصناف لديها رصيد أعلى من حد الأمان."
              icon={AlertTriangle}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-start">اللعبة</th>
                    <th className="px-4 py-3 text-start">الرصيد المتبقي</th>
                    <th className="px-4 py-3 text-start">حد الأمان</th>
                    <th className="px-4 py-3 text-start">الكمية المقترحة لإعادة الطلب</th>
                    <th className="px-4 py-3 text-end">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {localizedText(item.product_name, isAr ? 'ar' : 'en')}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{item.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
                          {item.stock} قطعة فقط
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{item.low_stock_threshold} قطعة</td>
                      <td className="px-4 py-3 font-mono text-blue-600 font-bold">
                        +{item.reorder_suggested_qty} قطعة
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button
                          type="button"
                          onClick={() =>
                            openAdjustment(item, 'توريد شحنة جديدة لتغطية النواقص')
                          }
                          className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          تسجيل توريد عاجل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              تسوية مخزون يدوية
            </h3>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اختر اللعبة *
                </label>
                <select
                  value={adjPayload.variant_id ? String(adjPayload.variant_id) : ''}
                  onChange={(e) => handleInventorySelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                >
                  <option value="">اختر الصنف من المخزون...</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {localizedText(item.product_name, isAr ? 'ar' : 'en')} ({item.sku}) - الرصيد الحالي: {item.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نوع العملية
                  </label>
                  <select
                    value={adjPayload.type}
                    onChange={(e) =>
                      setAdjPayload({
                        ...adjPayload,
                        type: e.target.value as StockAdjustmentPayload['type'],
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                  >
                    <option value="increment">إضافة رصيد (وارد +)</option>
                    <option value="decrement">خصم رصيد (منصرف/تلف -)</option>
                    <option value="set">تعيين رصيد ثابت (جرد)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الكمية
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjPayload.quantity}
                    onChange={(e) =>
                      setAdjPayload({ ...adjPayload, quantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 font-mono font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  سبب التسوية *
                </label>
                <input
                  type="text"
                  value={adjPayload.reason}
                  onChange={(e) => setAdjPayload({ ...adjPayload, reason: e.target.value })}
                  placeholder="مثال: جرد سنوي، توريد شحنة جديدة، تلف في الكرتونة"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="px-4 py-1.5 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {adjustMutation.isPending ? 'جارٍ التنفيذ...' : 'تأكيد التسوية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
