import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Trash2, Pencil, X } from 'lucide-react';
import { cmsService } from '@/src/services/cmsService';
import { StaticPage } from '@/src/types/cms';
import { localizedText } from '@/src/lib/api-helpers';
import { formatDate } from '@/src/lib/utils';
import LocalizedField from '@/src/components/forms/LocalizedField';
import ConfirmDialog from '@/src/components/common/ConfirmDialog';
import { toast } from 'sonner';

interface PageForm {
  title: { ar: string; en: string };
  slug: string;
  content: { ar: string; en: string };
  is_active: boolean;
}

const emptyForm: PageForm = {
  title: { ar: '', en: '' },
  slug: '',
  content: { ar: '', en: '' },
  is_active: true,
};

const slugify = (text: string): string =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const StaticPagesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [form, setForm] = useState<PageForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<StaticPage | null>(null);

  const { data: pagesRes } = useQuery({
    queryKey: ['cms', 'pages'],
    queryFn: () => cmsService.getPages(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cms', 'pages'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Partial<StaticPage> = {
        title: form.title,
        slug: form.slug || slugify(form.title.ar || form.title.en),
        content: form.content,
        is_published: form.is_active,
      };
      return editingId ? cmsService.updatePage(editingId, payload) : cmsService.createPage(payload);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editingId ? 'تم تحديث الصفحة بنجاح' : 'تم إنشاء الصفحة بنجاح');
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'تعذر حفظ الصفحة'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => cmsService.deletePage(id),
    onSuccess: () => {
      invalidate();
      toast.success('تم حذف الصفحة بنجاح');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'تعذر حذف الصفحة'),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: StaticPage) => {
    setEditingId(p.id);
    setForm({
      title: typeof p.title === 'string' ? { ar: p.title, en: p.title } : { ar: p.title?.ar || '', en: p.title?.en || '' },
      slug: p.slug || '',
      content:
        typeof p.content === 'string'
          ? { ar: p.content, en: p.content }
          : { ar: p.content?.ar || '', en: p.content?.en || '' },
      is_active: p.is_published,
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
      toast.error('يرجى إدخال عنوان الصفحة');
      return;
    }
    saveMutation.mutate();
  };

  const pages = pagesRes?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            الصفحات الثابتة والسياسات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة سياسة الخصوصية، معايير الأمان، الشروط والأحكام وسياسة الإرجاع
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة صفحة</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500">
            <tr>
              <th className="text-start px-4 py-3 font-semibold">العنوان</th>
              <th className="text-start px-4 py-3 font-semibold">Slug</th>
              <th className="text-start px-4 py-3 font-semibold">الحالة</th>
              <th className="text-start px-4 py-3 font-semibold">آخر تحديث</th>
              <th className="text-end px-4 py-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {localizedText(p.title, isAr ? 'ar' : 'en')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-slate-400">/{p.slug}</td>
                <td className="px-4 py-3">
                  {p.is_published ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      منشورة
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      مسودة
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400">{formatDate(p.updated_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      title="تعديل"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  لا توجد صفحات بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingId ? 'تعديل الصفحة' : 'إضافة صفحة جديدة'}
              </h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <LocalizedField
              label="عنوان الصفحة"
              required
              value={form.title}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))}
              placeholderAr="سياسة الشحن"
            />

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                الرابط اللطيف (Slug) — يُولّد تلقائياً إن تُرك فارغاً
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="shipping-policy"
                dir="ltr"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              />
            </div>

            <LocalizedField
              label="المحتوى"
              isTextarea
              rows={6}
              value={form.content}
              onChange={(v) => setForm((f) => ({ ...f, content: v }))}
              placeholderAr="<p>محتوى الصفحة...</p>"
            />

            <label className="inline-flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              منشورة
            </label>

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
                {editingId ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="حذف الصفحة"
        description="هل أنت متأكد من حذف هذه الصفحة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default StaticPagesPage;
