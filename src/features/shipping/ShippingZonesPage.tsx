import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus, MapPin } from 'lucide-react';
import { shippingService } from '@/src/services/shippingService';
import { ShippingZone } from '@/src/types/shipping';
import { formatCurrency } from '@/src/lib/utils';
import { toast } from 'sonner';

export const ShippingZonesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';
  const [modalOpen, setModalOpen] = useState(false);
  const [zoneName, setZoneName] = useState({ ar: '', en: '' });
  const [baseRate, setBaseRate] = useState(50);
  const [deliveryDays, setDeliveryDays] = useState('1 - 2 أيام');
  const [freeThreshold, setFreeThreshold] = useState(1000);

  const { data: zonesRes, isLoading } = useQuery({
    queryKey: ['shipping', 'zones'],
    queryFn: () => shippingService.getZones(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<ShippingZone>) => shippingService.createZone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping', 'zones'] });
      toast.success('تمت إضافة منطقة الشحن بنجاح');
      setModalOpen(false);
    },
  });

  const zones = zonesRes?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            مناطق ومحافظات الشحن
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تحديد تكلفة الشحن ومدة التوصيل وحد الشحن المجاني لكل محافظة
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منطقة جغرافية</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? zone.name.ar : zone.name.en}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{zone.delivery_time_days}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>سعر التوصيل الأساسي:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(zone.base_rate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>حد الشحن المجاني:</span>
                <span className="font-mono text-emerald-600 font-bold">
                  {zone.free_shipping_threshold ? formatCurrency(zone.free_shipping_threshold) : 'غير متاح'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">المحافظات المشمولة: </span>
              <span>{zone.governorates.join('، ')}</span>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              إضافة منطقة شحن جديدة
            </h3>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">اسم المنطقة *</label>
              <input
                type="text"
                value={zoneName.ar}
                onChange={(e) => setZoneName({ ar: e.target.value, en: e.target.value })}
                placeholder="مدن القناة وسيناء"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">سعر الشحن (ج.م)</label>
                <input
                  type="number"
                  value={baseRate}
                  onChange={(e) => setBaseRate(Number(e.target.value))}
                  className="w-full p-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">مدة التوصيل</label>
                <input
                  type="text"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  placeholder="2 - 3 أيام"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
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
                type="button"
                onClick={() => {
                  createMutation.mutate({
                    name: zoneName,
                    base_rate: baseRate,
                    delivery_time_days: deliveryDays,
                    free_shipping_threshold: freeThreshold,
                    governorates: ['محافظات جديدة'],
                  });
                }}
                className="px-4 py-1.5 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                حفظ المنطقة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingZonesPage;
