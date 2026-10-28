import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Tag, Percent, Calendar } from 'lucide-react';
import { promotionService } from '@/src/services/promotionService';
import { Coupon, CouponType } from '@/src/types/promotion';
import ConfirmDialog from '@/src/components/common/ConfirmDialog';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { toast } from 'sonner';

export const CouponsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [type, setType] = useState<CouponType>('percentage');
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState<number | undefined>(500);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(100);

  const { data: couponsRes, isLoading } = useQuery({
    queryKey: ['promotions', 'coupons'],
    queryFn: () => promotionService.getCoupons(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Coupon>) => promotionService.createCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', 'coupons'] });
      toast.success('تم إنشاء الكوبون بنجاح');
      setModalOpen(false);
      setCode('');
      setDescriptionAr('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => promotionService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', 'coupons'] });
      toast.success('تم حذف الكوبون');
      setDeleteId(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('يرجى إدخال رمز الكوبون');
      return;
    }
    createMutation.mutate({
      code: code.trim().toUpperCase(),
      description: { ar: descriptionAr, en: descriptionAr },
      type,
      value: Number(value),
      min_order_value: minOrder ? Number(minOrder) : undefined,
      usage_limit: usageLimit ? Number(usageLimit) : undefined,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
    });
  };

  const coupons = couponsRes?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            كوبونات وقسائم الخصم
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة رموز الخصم الترويجية والشحن المجاني مع قيود الاستخدام
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء كوبون جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                  <Tag className="w-4 h-4" />
                </div>
                <span className="font-mono font-bold text-sm tracking-wider text-slate-900 dark:text-slate-100">
                  {c.code}
                </span>
              </div>
              <button
                onClick={() => setDeleteId(c.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {c.description ? (isAr ? c.description.ar : c.description.en) : 'كوبون خصم ترويجي'}
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {c.type === 'percentage'
                  ? `خصم ${c.value}%`
                  : c.type === 'fixed'
                  ? `خصم ${formatCurrency(c.value)}`
                  : 'شحن مجاني'}
              </span>
              <span className="text-slate-400">
                استُخدم: {c.usage_count} {c.usage_limit ? `/ ${c.usage_limit}` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              إنشاء كوبون خصم جديد
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">رمز الكوبون (Code) *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="TOYFUN20"
                  className="w-full p-2 font-mono uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">وصف العرض</label>
                <input
                  type="text"
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="خصم 20% بمناسبة إجازة نهاية الأسبوع"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">نوع الخصم</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                    <option value="free_shipping">شحن مجاني</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">قيمة الخصم</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full p-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">الحد الأدنى للطلب</label>
                  <input
                    type="number"
                    value={minOrder || ''}
                    onChange={(e) => setMinOrder(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="500 ج.م"
                    className="w-full p-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">أقصى عدد مرات استخدام</label>
                  <input
                    type="number"
                    value={usageLimit || ''}
                    onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="100 مرة"
                    className="w-full p-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  حفظ الكوبون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="حذف كوبون الخصم"
        description="هل أنت متأكد من حذف هذا الكوبون نهائياً؟ لن يتمكن العملاء من استخدامه بعد الآن."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};

export default CouponsPage;
