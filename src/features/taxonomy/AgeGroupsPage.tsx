import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { taxonomyService } from '@/src/services/taxonomyService';
import { AgeGroup } from '@/src/types/product';
import { localizedText, toNumber } from '@/src/lib/api-helpers';
import ConfirmDialog from '@/src/components/common/ConfirmDialog';
import { toast } from 'sonner';

interface AgeForm {
  name: string;
  min_age: string;
  max_age: string;
  sort_order: string;
  is_active: boolean;
}

const EMPTY_FORM: AgeForm = { name: '', min_age: '', max_age: '', sort_order: '0', is_active: true };

export const AgeGroupsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AgeGroup | null>(null);
  const [form, setForm] = useState<AgeForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);

  const { data: ageGroupsRes, isLoading } = useQuery({
    queryKey: ['taxonomy', 'age-groups'],
    queryFn: () => taxonomyService.getAgeGroups(),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const createMutation = useMutation({
    mutationFn: (payload: Partial<AgeGroup>) => taxonomyService.createAgeGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', 'age-groups'] });
      toast.success('تمت إضافة الفئة العمرية');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Partial<AgeGroup> }) =>
      taxonomyService.updateAgeGroup(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', 'age-groups'] });
      toast.success('تم تحديث الفئة العمرية');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => taxonomyService.deleteAgeGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', 'age-groups'] });
      toast.success('تم حذف الفئة العمرية');
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (ag: AgeGroup) => {
    setEditing(ag);
    setForm({
      name: localizedText(ag.name),
      min_age: String(ag.min_age ?? ''),
      max_age: ag.max_age !== undefined && ag.max_age !== null ? String(ag.max_age) : '',
      sort_order: String(ag.sort_order ?? 0),
      is_active: ag.is_active ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('يرجى إدخال اسم الفئة العمرية');
      return;
    }
    if (form.min_age === '' || Number.isNaN(Number(form.min_age))) {
      toast.error('يرجى إدخال العمر الأدنى بالأشهر');
      return;
    }
    const payload: Partial<AgeGroup> = {
      name: form.name.trim(),
      min_age: toNumber(form.min_age),
      max_age: form.max_age === '' ? undefined : toNumber(form.max_age),
      sort_order: toNumber(form.sort_order),
      is_active: form.is_active,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const ageGroups = ageGroupsRes?.data || [];
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const inputClass =
    'w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            الفئات العمرية للأطفال
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تصنيف ألعاب الأطفال بحسب المرحلة العمرية والنمائية المناسبة
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فئة عمرية</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ageGroups.map((ag) => (
            <div
              key={ag.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: ag.badge_color || '#3B82F6' }}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {localizedText(ag.name, isAr ? 'ar' : 'en')}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      من {ag.min_age} إلى {ag.max_age ?? '∞'} شهر
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => openEdit(ag)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md transition-colors"
                    title="تعديل"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(ag.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>عدد الألعاب المطابقة:</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                  {ag.products_count || 0} لعبة
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {editing ? 'تعديل الفئة العمرية' : 'إضافة فئة عمرية جديدة'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الفئة العمرية *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: 15+ سنة"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    العمر الأدنى (بالأشهر) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.min_age}
                    onChange={(e) => setForm({ ...form, min_age: e.target.value })}
                    placeholder="180"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    العمر الأقصى (اختياري)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.max_age}
                    onChange={(e) => setForm({ ...form, max_age: e.target.value })}
                    placeholder="اتركه فارغاً للمفتوح"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  className={inputClass}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">الفئة مفعّلة</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70"
                >
                  {editing ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="حذف الفئة العمرية"
        description="هل أنت متأكد من حذف هذه الفئة العمرية؟"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};

export default AgeGroupsPage;
