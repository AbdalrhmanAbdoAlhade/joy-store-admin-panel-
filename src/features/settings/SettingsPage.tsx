import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, Store, Shield, Heart, Share2, Truck } from 'lucide-react';
import { settingsService } from '@/src/services/settingsService';
import { NormalizedSettings, SettingsGroup, SettingsValue } from '@/src/types/settings';
import { toast } from 'sonner';

const GROUP_META: Record<string, { label: string; icon: React.ElementType }> = {
  general: { label: 'الهوية والمعلومات العامة', icon: Store },
  shipping: { label: 'إعدادات الشحن والتوصيل', icon: Truck },
  loyalty: { label: 'برنامج نقاط الولاء', icon: Heart },
  social: { label: 'روابط التواصل الاجتماعي', icon: Share2 },
};

const KEY_LABELS: Record<string, string> = {
  store_name: 'اسم المتجر التجاري',
  store_email: 'البريد الإلكتروني الرسمي',
  store_phone: 'رقم خدمة العملاء (هاتف)',
  store_address: 'عنوان المتجر',
  currency: 'العملة الافتراضية',
  currency_symbol: 'رمز العملة',
  tax_rate: 'نسبة ضريبة القيمة المضافة (%)',
  maintenance_mode: 'تفعيل وضع الصيانة (Maintenance Mode)',
  free_shipping_above: 'الشحن المجاني للطلبات أعلى من (ج.م)',
  points_earn_rate: 'معدل اكتساب النقاط لكل ج.م',
  points_to_currency_rate: 'قيمة النقطة بالعملة',
  min_points_redeem: 'الحد الأدنى لاستبدال النقاط',
  facebook_url: 'رابط فيسبوك',
  instagram_url: 'رابط إنستجرام',
  whatsapp_number: 'رقم الواتساب',
};

const prettyKey = (key: string) =>
  KEY_LABELS[key] ||
  key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<NormalizedSettings | null>(null);

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['settings', 'store'],
    queryFn: () => settingsService.getSettings(),
  });

  useEffect(() => {
    if (settingsRes?.data) setFormData(settingsRes.data);
  }, [settingsRes]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<NormalizedSettings>) => settingsService.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('تم حفظ إعدادات المتجر بنجاح');
    },
  });

  if (isLoading || !formData) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const updateField = (group: string, key: string, value: SettingsValue) => {
    setFormData((prev) =>
      prev ? { ...prev, [group]: { ...(prev[group] || {}), [key]: value } } : prev
    );
  };

  const renderField = (group: string, key: string, value: SettingsValue) => {
    const inputClass =
      'w-full p-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden';

    if (typeof value === 'boolean') {
      return (
        <label key={key} className="flex items-center gap-2 cursor-pointer select-none text-xs">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateField(group, key, e.target.checked)}
            className="rounded text-blue-600 w-4 h-4"
          />
          <span className="font-semibold text-slate-700 dark:text-slate-300">{prettyKey(key)}</span>
        </label>
      );
    }

    return (
      <div key={key}>
        <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1 text-xs">
          {prettyKey(key)}
        </label>
        <input
          type={typeof value === 'number' ? 'number' : 'text'}
          value={value as any}
          dir={typeof value === 'number' ? 'ltr' : undefined}
          onChange={(e) =>
            updateField(group, key, typeof value === 'number' ? Number(e.target.value) : e.target.value)
          }
          className={inputClass}
        />
      </div>
    );
  };

  const groups = Object.keys(formData);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            إعدادات المتجر والنظام
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            بيانات المتجر، الشحن، برنامج الولاء، الضرائب وروابط التواصل
          </p>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => {
          const meta = GROUP_META[group] || { label: group, icon: Shield };
          const Icon = meta.icon;
          const fields = formData[group] || {};
          const keys = Object.keys(fields);
          return (
            <div
              key={group}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Icon className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{meta.label}</h2>
              </div>

              {keys.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد إعدادات في هذه المجموعة.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {keys.map((key) => renderField(group, key, fields[key] as SettingsValue))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </form>
  );
};

export default SettingsPage;
