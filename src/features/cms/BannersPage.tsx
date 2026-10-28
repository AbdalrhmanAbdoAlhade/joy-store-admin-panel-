import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Image as ImageIcon, Trash2, Pencil, X } from 'lucide-react';
import { cmsService } from '@/src/services/cmsService';
import { Banner } from '@/src/types/cms';
import { ProductImage } from '@/src/types/product';
import { localizedText } from '@/src/lib/api-helpers';
import LocalizedField from '@/src/components/forms/LocalizedField';
import ImageUploader from '@/src/components/forms/ImageUploader';
import ConfirmDialog from '@/src/components/common/ConfirmDialog';
import { toast } from 'sonner';

interface BannerForm {
  title: { ar: string; en: string };
  placement: 'home_slider' | 'home_banner';
  link: string;
  sort_order: number;
  is_active: boolean;
  images: ProductImage[];
}

const emptyForm: BannerForm = {
  title: { ar: '', en: '' },
  placement: 'home_slider',
  link: '',
  sort_order: 0,
  is_active: true,
  images: [],
};

export const BannersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const { data: bannersRes, isLoading } = useQuery({
    queryKey: ['cms', 'banners'],
    queryFn: () => cmsService.getBanners(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cms', 'banners'] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const image = form.images[0]?.file;
      const payload: Partial<Banner> = {
        title: form.title,
        placement: form.placement,
        link_url: form.link,
        order: form.sort_order,
        is_active: form.is_active,
      };
      return editingId
        ? cmsService.updateBanner(editingId, payload, image)
        : cmsService.createBanner(payload, image);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editingId ? 'تم تحديث البانر بنجاح' : 'تمت إضافة البانر بنجاح');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'تعذر حفظ البانر');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => cmsService.deleteBanner(id),
    onSuccess: () => {
      invalidate();
      toast.success('تم حذف البانر بنجاح');
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'تعذر حذف البانر');
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      title:
        typeof b.title === 'string'
          ? { ar: b.title, en: b.title }
          : { ar: b.title?.ar || '', en: b.title?.en || '' },
      placement: b.placement === 'home_banner' ? 'home_banner' : 'home_slider',
      link: b.link_url || '',
      sort_order: b.order ?? 0,
      is_active: b.is_active,
      images: b.image_url
        ? [{ id: `existing_${b.id}`, url: b.image_url, order: 0, is_primary: true }]
        : [],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.title.ar.trim()) {
      toast.error('يرجى إدخال عنوان البانر');
      return;
    }
    saveMutation.mutate();
  };

  const banners = bannersRes?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            البانرات والشرائح الترويجية (Banners & Sliders)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة البانرات المعروضة في الصفحة الرئيسية وأقسام المتجر
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة بانر جديد</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-xs text-slate-400 py-10">جاري التحميل...</div>
      ) : banners.length === 0 ? (
        <div className="text-center text-xs text-slate-400 py-10">لا توجد بانرات بعد</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs"
            >
              <div className="h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                {b.image_url ? (
                  <img src={b.image_url} alt="banner" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2 start-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white">
                  {b.placement === 'home_slider' ? 'سلايدر رئيسي' : 'بانر'}
                </div>
                {!b.is_active && (
                  <div className="absolute top-2 end-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                    غير مفعّل
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {localizedText(b.title, isAr ? 'ar' : 'en')}
                </h3>
                {b.link_url && (
                  <p className="text-[11px] font-mono text-slate-400 truncate">{b.link_url}</p>
                )}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openEdit(b)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    تعديل
                  </button>
                  <button
                    onClick={() => setDeleteTarget(b)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingId ? 'تعديل البانر' : 'إضافة بانر جديد'}
              </h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <LocalizedField
              label="عنوان البانر"
              required
              value={form.title}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))}
              placeholderAr="مهرجان الصيف لألعاب الذكاء"
            />

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">موضع العرض</label>
              <select
                value={form.placement}
                onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value as any }))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              >
                <option value="home_slider">سلايدر الصفحة الرئيسية (home_slider)</option>
                <option value="home_banner">بانر الصفحة الرئيسية (home_banner)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">الرابط (اختياري)</label>
              <input
                type="text"
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="/products?on_sale=1"
                dir="ltr"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">الترتيب</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  مفعّل
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">صورة البانر</label>
              <ImageUploader
                images={form.images}
                onChange={(images) => setForm((f) => ({ ...f, images }))}
                maxFiles={1}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70"
              >
                {saveMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {editingId ? 'حفظ التعديلات' : 'حفظ ونشر'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="حذف البانر"
        description="هل أنت متأكد من حذف هذا البانر؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default BannersPage;
