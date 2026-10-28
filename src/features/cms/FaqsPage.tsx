import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, HelpCircle, Trash2, Pencil, X } from 'lucide-react';
import { cmsService } from '@/src/services/cmsService';
import { FaqItem } from '@/src/types/cms';
import { localizedText } from '@/src/lib/api-helpers';
import ConfirmDialog from '@/src/components/common/ConfirmDialog';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'general', label: 'عام' },
  { value: 'payment', label: 'الدفع' },
  { value: 'shipping', label: 'الشحن' },
  { value: 'returns', label: 'الإرجاع' },
];

interface FaqForm {
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FaqForm = {
  question: '',
  answer: '',
  category: 'general',
  sort_order: 0,
  is_active: true,
};

export const FaqsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [form, setForm] = useState<FaqForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);

  const { data: faqsRes } = useQuery({
    queryKey: ['cms', 'faqs'],
    queryFn: () => cmsService.getFaqs(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cms', 'faqs'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        question: { ar: form.question, en: form.question },
        answer: { ar: form.answer, en: form.answer },
        category: form.category,
        order: form.sort_order,
        is_active: form.is_active,
      };
      return editingId ? cmsService.updateFaq(editingId, payload) : cmsService.createFaq(payload);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editingId ? 'تم تحديث السؤال بنجاح' : 'تم إنشاء السؤال بنجاح');
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'تعذر حفظ السؤال'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => cmsService.deleteFaq(id),
    onSuccess: () => {
      invalidate();
      toast.success('تم حذف السؤال بنجاح');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'تعذر حذف السؤال'),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (f: FaqItem) => {
    setEditingId(f.id);
    setForm({
      question: localizedText(f.question, isAr ? 'ar' : 'en'),
      answer: localizedText(f.answer, isAr ? 'ar' : 'en'),
      category: f.category || 'general',
      sort_order: f.order ?? 0,
      is_active: f.is_active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.question.trim()) {
      toast.error('يرجى إدخال نص السؤال');
      return;
    }
    if (!form.answer.trim()) {
      toast.error('يرجى إدخال نص الإجابة');
      return;
    }
    saveMutation.mutate();
  };

  const faqs = faqsRes?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            الأسئلة الشائعة (FAQs)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إجابات جاهزة على أكثر الأسئلة تكراراً من أولياء الأمور حول سلامة الألعاب ومواعيد الشحن
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة سؤال</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500">
            <tr>
              <th className="text-start px-4 py-3 font-semibold">السؤال</th>
              <th className="text-start px-4 py-3 font-semibold">الفئة</th>
              <th className="text-start px-4 py-3 font-semibold">الترتيب</th>
              <th className="text-start px-4 py-3 font-semibold">الحالة</th>
              <th className="text-end px-4 py-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {faqs.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2 max-w-md">
                    <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {localizedText(f.question, isAr ? 'ar' : 'en')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{f.category}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{f.order}</td>
                <td className="px-4 py-3">
                  {f.is_active ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      مفعّل
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      معطّل
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(f)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      title="تعديل"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(f)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {faqs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  لا توجد أسئلة بعد
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
                {editingId ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
              </h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                السؤال <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder="هل يوجد تقسيط؟"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                الإجابة <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                placeholder="حالياً لا يتوفر التقسيط"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">الفئة</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label} ({c.value})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">الترتيب</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              مفعّل
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
        title="حذف السؤال"
        description="هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FaqsPage;
