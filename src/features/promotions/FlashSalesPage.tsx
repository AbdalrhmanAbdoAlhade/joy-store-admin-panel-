import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Award, Save, Clock } from 'lucide-react';
import { promotionService } from '@/src/services/promotionService';
import { LoyaltySettings } from '@/src/types/promotion';
import EmptyState from '@/src/components/common/EmptyState';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { toast } from 'sonner';

export const FlashSalesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const { data: flashSalesRes } = useQuery({
    queryKey: ['promotions', 'flash-sales'],
    queryFn: () => promotionService.getFlashSales(),
  });

  const { data: loyaltyRes } = useQuery({
    queryKey: ['promotions', 'loyalty-settings'],
    queryFn: () => promotionService.getLoyaltySettings(),
  });

  const [loyaltyForm, setLoyaltyForm] = useState<LoyaltySettings>({
    is_enabled: true,
    points_per_egp: 1,
    point_value_egp: 0.05,
    min_points_to_redeem: 200,
    points_expiry_days: 180,
    welcome_bonus_points: 50,
  });

  useEffect(() => {
    if (loyaltyRes?.data) setLoyaltyForm(loyaltyRes.data);
  }, [loyaltyRes]);

  const loyaltyMutation = useMutation({
    mutationFn: (payload: Partial<LoyaltySettings>) =>
      promotionService.updateLoyaltySettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', 'loyalty-settings'] });
      toast.success('تم حفظ إعدادات نقاط الولاء بنجاح');
    },
  });

  const flashSales = flashSalesRes?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          العروض السريعة ونقاط الولاء (Loyalty Points)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          إدارة حملات Flash Sales المؤقتة وسياسة نقاط المكافآت لأولياء الأمور
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flash Sales Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              حملات الفلاش سيل النشطة (Flash Sales)
            </h2>
          </div>

          <div className="space-y-4">
            {flashSales.map((fs) => (
              <div
                key={fs.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {isAr ? fs.title.ar : fs.title.en}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>ينتهي في: {formatDate(fs.end_at)}</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                    نشط الآن
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  {fs.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="truncate max-w-[200px] text-slate-700 dark:text-slate-300">
                        {isAr ? item.product_name.ar : item.product_name.en}
                      </span>
                      <div className="font-mono flex items-center gap-2">
                        <span className="line-through text-slate-400 text-[11px]">
                          {formatCurrency(item.original_price)}
                        </span>
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(item.sale_price)}
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded">
                          -{item.discount_percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty Points Settings — backend endpoint not available (hidden) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <EmptyState
            message="برنامج نقاط الولاء"
            description="هذه الميزة غير متوفرة في الخادم حالياً وستُطلق قريباً"
          />
        </div>
        {false && (
        <div className="hidden space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Award className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              برنامج نقاط الولاء ومكافآت السلة
            </h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loyaltyMutation.mutate(loyaltyForm);
            }}
            className="space-y-4 text-xs"
          >
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={loyaltyForm.is_enabled}
                onChange={(e) => setLoyaltyForm({ ...loyaltyForm, is_enabled: e.target.checked })}
                className="rounded text-blue-600 w-4 h-4"
              />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                تفعيل برنامج نقاط الولاء في المتجر
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  النقاط المكتسبة لكل جنيه مصري
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={loyaltyForm.points_per_egp}
                  onChange={(e) =>
                    setLoyaltyForm({ ...loyaltyForm, points_per_egp: Number(e.target.value) })
                  }
                  className="w-full p-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  قيمة النقطة الواحدة بالجنيه
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={loyaltyForm.point_value_egp}
                  onChange={(e) =>
                    setLoyaltyForm({ ...loyaltyForm, point_value_egp: Number(e.target.value) })
                  }
                  className="w-full p-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  الحد الأدنى لاستبدال النقاط
                </label>
                <input
                  type="number"
                  value={loyaltyForm.min_points_to_redeem}
                  onChange={(e) =>
                    setLoyaltyForm({ ...loyaltyForm, min_points_to_redeem: Number(e.target.value) })
                  }
                  className="w-full p-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  صلاحية النقاط (أيام)
                </label>
                <input
                  type="number"
                  value={loyaltyForm.points_expiry_days}
                  onChange={(e) =>
                    setLoyaltyForm({ ...loyaltyForm, points_expiry_days: Number(e.target.value) })
                  }
                  className="w-full p-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled
                title="قريباً"
                className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ سياسة النقاط (قريباً)</span>
              </button>
            </div>
          </form>
        </div>
        )}
      </div>
    </div>
  );
};

export default FlashSalesPage;
