import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Boxes } from 'lucide-react';
import { taxonomyService } from '@/src/services/taxonomyService';
import { Brand, ProductImage } from '@/src/types/product';
import ImageUploader from '@/src/components/forms/ImageUploader';
import ConfirmDialog from '@/src/components/common/ConfirmDialog';
import { toast } from 'sonner';

const toImages = (logo?: string): ProductImage[] =>
  logo ? [{ id: 'existing', url: logo, order: 0, is_primary: true }] : [];

export const BrandsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandImages, setBrandImages] = useState<ProductImage[]>([]);
  const [brandActive, setBrandActive] = useState(true);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);

  const { data: brandsRes, isLoading } = useQuery({
    queryKey: ['taxonomy', 'brands'],
    queryFn: () => taxonomyService.getBrands(),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingBrand(null);
    setBrandName('');
    setBrandImages([]);
    setBrandActive(true);
  };

  const createMutation = useMutation({
    mutationFn: ({ payload, logo }: { payload: Partial<Brand>; logo?: File }) =>
      taxonomyService.createBrand(payload, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', 'brands'] });
      toast.success('تمت إضافة العلامة التجارية بنجاح');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload, logo }: { id: number | string; payload: Partial<Brand>; logo?: File }) =>
      taxonomyService.updateBrand(id, payload, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', 'brands'] });
      toast.success('تم تحديث العلامة التجارية');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => taxonomyService.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', 'brands'] });
      toast.success('تم حذف الماركة');
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandImages([]);
    setBrandActive(true);
    setModalOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandName(brand.name || '');
    setBrandImages(toImages(brand.logo));
    setBrandActive(brand.is_active);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!brandName.trim()) {
      toast.error('يرجى إدخال اسم الماركة');
      return;
    }
    const logo = brandImages[0]?.file;
    const payload: Partial<Brand> = { name: brandName.trim(), is_active: brandActive };
    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, payload, logo });
    } else {
      createMutation.mutate({ payload, logo });
    }
  };

  const brands = brandsRes?.data || [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            العلامات التجارية ومصنّعو الألعاب
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الماركات العالمية والمحلية مثل LEGO, Fisher-Price, Mattel
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة علامة تجارية</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map((b) => (
            <div
              key={b.id}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                {b.logo ? (
                  <img src={b.logo} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                    <Boxes className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {b.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {b.products_count || 0} لعبة مسجلة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => openEdit(b)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md transition-colors"
                  title="تعديل"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteId(b.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-sm my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {editingBrand ? 'تعديل الماركة' : 'إضافة ماركة جديدة'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                اسم الماركة *
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="اسم الماركة (مثال: Hasbro)"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الشعار (اختياري)
              </label>
              <ImageUploader images={brandImages} onChange={setBrandImages} maxFiles={1} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                checked={brandActive}
                onChange={(e) => setBrandActive(e.target.checked)}
                className="rounded text-blue-600 w-4 h-4"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">الماركة مفعّلة</span>
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70"
              >
                {editingBrand ? 'تحديث' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="حذف العلامة التجارية"
        description="هل أنت متأكد من حذف هذه الماركة؟"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};

export default BrandsPage;
