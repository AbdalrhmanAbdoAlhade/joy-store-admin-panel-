import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight, Folder, FolderPlus } from 'lucide-react';
import { taxonomyService } from '@/src/services/taxonomyService';
import { Category, ProductImage } from '@/src/types/product';
import { localizedText } from '@/src/lib/api-helpers';
import LocalizedField from '@/src/components/forms/LocalizedField';
import ImageUploader from '@/src/components/forms/ImageUploader';
import ConfirmDialog from '@/src/components/common/ConfirmDialog';
import { toast } from 'sonner';

const toImages = (image?: string): ProductImage[] =>
  image ? [{ id: 'existing', url: image, order: 0, is_primary: true }] : [];

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({ '1': true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<number | string | null>(null);
  const [catName, setCatName] = useState({ ar: '', en: '' });
  const [catImages, setCatImages] = useState<ProductImage[]>([]);
  const [catActive, setCatActive] = useState(true);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);

  const { data: categoriesRes, isLoading } = useQuery({
    queryKey: ['taxonomy', 'categories'],
    queryFn: () => taxonomyService.getCategories(),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingCat(null);
    setParentIdForNew(null);
    setCatName({ ar: '', en: '' });
    setCatImages([]);
    setCatActive(true);
  };

  const createMutation = useMutation({
    mutationFn: ({ payload, image }: { payload: Partial<Category>; image?: File }) =>
      taxonomyService.createCategory(payload, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', 'categories'] });
      toast.success('تمت إضافة القسم بنجاح');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload, image }: { id: number | string; payload: Partial<Category>; image?: File }) =>
      taxonomyService.updateCategory(id, payload, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', 'categories'] });
      toast.success('تم تحديث القسم بنجاح');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => taxonomyService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', 'categories'] });
      toast.success('تم حذف القسم بنجاح');
      setDeleteId(null);
    },
  });

  const toggleExpand = (id: string | number) => {
    setExpandedCats((prev) => ({ ...prev, [String(id)]: !prev[String(id)] }));
  };

  const handleOpenCreate = (parentId: number | string | null = null) => {
    setEditingCat(null);
    setParentIdForNew(parentId);
    setCatName({ ar: '', en: '' });
    setCatImages([]);
    setCatActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCat(cat);
    setParentIdForNew(cat.parent_id ?? null);
    setCatName({ ar: localizedText(cat.name, 'ar'), en: localizedText(cat.name, 'en') });
    setCatImages(toImages(cat.image));
    setCatActive(cat.is_active);
    setModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.ar.trim()) {
      toast.error('يرجى كتابة اسم القسم بالعربية');
      return;
    }
    const image = catImages[0]?.file;
    const payload: Partial<Category> = {
      name: catName,
      parent_id: editingCat ? editingCat.parent_id : parentIdForNew,
      is_active: catActive,
    };
    if (editingCat) {
      updateMutation.mutate({ id: editingCat.id, payload, image });
    } else {
      createMutation.mutate({ payload, image });
    }
  };

  const categories = categoriesRes?.data || [];

  // Backend returns a flat list (each item carries parent_id) — rebuild the tree for display.
  const tree = useMemo(() => {
    const byId = new Map<string, Category>();
    categories.forEach((c) => byId.set(String(c.id), { ...c, children: [] }));
    const roots: Category[] = [];
    byId.forEach((c) => {
      if (c.parent_id && byId.has(String(c.parent_id))) {
        byId.get(String(c.parent_id))!.children!.push(c);
      } else {
        roots.push(c);
      }
    });
    return roots;
  }, [categories]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            أقسام وتصنيفات الألعاب
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تنظيم شجرة الأقسام المتداخلة لألعاب الأطفال وسهولة التصفح
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreate(null)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم رئيسي</span>
        </button>
      </div>

      {/* Category Tree Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          هيكل شجرة الأقسام
        </h2>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {tree.map((cat) => {
              const isExpanded = !!expandedCats[String(cat.id)];
              const hasChildren = cat.children && cat.children.length > 0;

              return (
                <div key={cat.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(cat.id)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                          )}
                        </button>
                      ) : (
                        <span className="w-6" />
                      )}
                      {cat.image ? (
                        <img src={cat.image} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-md object-cover" />
                      ) : (
                        <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {localizedText(cat.name, isAr ? 'ar' : 'en')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono ms-2">
                          ({cat.products_count || 0} لعبة)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenCreate(cat.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors"
                        title="إضافة قسم فرعي داخل هذا القسم"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>قسم فرعي</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        title="تعديل القسم"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(cat.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
                        title="حذف القسم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Children Sub-categories */}
                  {hasChildren && isExpanded && (
                    <div className="p-3 bg-white dark:bg-slate-900 ps-10 space-y-2 border-t border-slate-100 dark:border-slate-800">
                      {cat.children!.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">└─</span>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {localizedText(sub.name, isAr ? 'ar' : 'en')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({sub.products_count || 0} لعبة)
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sub)}
                              className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title="تعديل القسم الفرعي"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(sub.id)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {editingCat
                ? 'تعديل القسم'
                : parentIdForNew
                  ? 'إضافة قسم فرعي جديد'
                  : 'إضافة قسم رئيسي جديد'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <LocalizedField
                label="اسم القسم"
                required
                value={catName}
                onChange={setCatName}
                placeholderAr="مثال: ألعاب الذكاء والألغاز"
                placeholderEn="e.g. Brain & Puzzle Toys"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  صورة القسم (اختياري)
                </label>
                <ImageUploader images={catImages} onChange={setCatImages} maxFiles={1} />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                <input
                  type="checkbox"
                  checked={catActive}
                  onChange={(e) => setCatActive(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">القسم مفعّل</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
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
                  {editingCat ? 'تحديث القسم' : 'حفظ القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="حذف هذا القسم"
        description="هل أنت متأكد من حذف هذا القسم؟ إذا كان يحتوي على أقسام فرعية أو ألعاب فسيتم فك ارتباطها."
        confirmLabel="حذف"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};

export default CategoriesPage;
