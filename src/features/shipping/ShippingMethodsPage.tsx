import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, CheckCircle2, Store, Clock } from 'lucide-react';
import { shippingService } from '@/src/services/shippingService';
import { formatCurrency } from '@/src/lib/utils';

export const ShippingMethodsPage: React.FC = () => {
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const { data: methodsRes, isLoading } = useQuery({
    queryKey: ['shipping', 'methods'],
    queryFn: () => shippingService.getMethods(),
  });

  const methods = methodsRes?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          طرق التوصيل وخيارات الاستلام
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          خيارات التوصيل المتاحة للعميل في صفحة الدفع (شحن عادي، شحن في نفس اليوم، استلام من الفرع)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {methods.map((method) => (
          <div
            key={method.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                {method.code === 'branch_pickup' ? <Store className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? method.name.ar : method.name.en}
                </h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {method.code}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">التكلفة الإضافية:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {method.cost === 0 ? 'مجاني' : formatCurrency(method.cost)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مفعلة وتظهر في المتجر</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShippingMethodsPage;
