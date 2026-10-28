import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Save, Power } from 'lucide-react';
import { paymentService } from '@/src/services/paymentService';
import { PaymentGatewaysConfig } from '@/src/types/payment';
import { toast } from 'sonner';

export const PaymentGatewaysPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PaymentGatewaysConfig | null>(null);

  const { data: gatewaysRes, isLoading } = useQuery({
    queryKey: ['payments', 'gateways'],
    queryFn: () => paymentService.getGateways(),
  });

  useEffect(() => {
    if (gatewaysRes?.data) setForm(gatewaysRes.data);
  }, [gatewaysRes]);

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<PaymentGatewaysConfig>) => paymentService.updateGateways(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'gateways'] });
      toast.success('تم تحديث بوابات الدفع بنجاح');
    },
  });

  if (isLoading || !form) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const update = (key: keyof PaymentGatewaysConfig, value: any) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const cardClass =
    'p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            بوابات الدفع الإلكتروني
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة تفعيل الدفع عند الاستلام وبوابة Paymob وبيانات التكامل (API Keys)
          </p>
        </div>

        <button
          type="button"
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-70 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cash on Delivery */}
        <div className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  الدفع عند الاستلام (Cash on Delivery)
                </h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase">CODE: cod</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => update('cod_enabled', !form.cod_enabled)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                form.cod_enabled
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{form.cod_enabled ? 'مفعلة' : 'معطلة'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            تحصيل قيمة الطلب نقدًا عند استلام الشحنة.
          </p>
        </div>

        {/* Paymob */}
        <div className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  بوابه Paymob (بطاقات ومحافظ)
                </h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase">CODE: paymob</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => update('paymob_enabled', !form.paymob_enabled)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                form.paymob_enabled
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{form.paymob_enabled ? 'مفعلة' : 'معطلة'}</span>
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {(
              [
                ['paymob_api_key', 'API Key'],
                ['paymob_integration_id', 'Integration ID'],
                ['paymob_iframe_id', 'Iframe ID'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  className="w-full p-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewaysPage;
