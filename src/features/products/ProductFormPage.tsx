import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  ShieldAlert,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { productService } from '@/src/services/productService';
import { taxonomyService } from '@/src/services/taxonomyService';
import { Product, ProductVariant, ProductImage } from '@/src/types/product';
import LocalizedField from '@/src/components/forms/LocalizedField';
import ImageUploader from '@/src/components/forms/ImageUploader';
import EmptyState from '@/src/components/common/EmptyState';
import PageLoader from '@/src/components/loaders/PageLoader';
import { localizedText } from '@/src/lib/api-helpers';
import { toast } from 'sonner';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const [activeSection, setActiveSection] = useState<'basic' | 'pricing' | 'toys' | 'variants' | 'media' | 'taxonomy' | 'seo'>('basic');

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: { ar: '', en: '' },
    slug: '',
    description: { ar: '', en: '' },
    short_description: { ar: '', en: '' },
    sku: '',
    barcode: '',
    status: 'active',
    price: 0,
    discount_price: undefined,
    cost_price: 0,
    tax_rate: 14,
    stock: 10,
    low_stock_threshold: 5,
    has_variants: false,
    variants: [],
    images: [],
    video_url: '',
    category_id: undefined,
    brand_id: undefined,
    age_group_id: undefined,
    toy_details: {
      age_range_min: 3,
      age_range_max: 8,
      target_gender: 'unisex',
      materials: ['ABS Plastic (BPA-Free)'],
      requires_batteries: false,
      battery_type: '',
      batteries_included: false,
      choking_hazard: false,
      safety_warnings: { ar: 'غير مناسب للأطفال دون 3 سنوات لوجود قطع صغيرة.', en: 'Not suitable for children under 3 years due to small parts.' },
      certifications: ['EN71', 'CE'],
      piece_count: 1,
    },
    meta_title: { ar: '', en: '' },
    meta_description: { ar: '', en: '' },
    meta_keywords: '',
  });

  // Load existing data if editing (no mock fallback — surface load failures)
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await productService.getProductById(id!);
        if (!active) return;
        if (!res?.data) throw new Error('empty');
        setFormData(res.data);
        setLoadError(false);
      } catch {
        if (!active) return;
        setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  // Taxonomy options
  const { data: categoriesRes } = useQuery({
    queryKey: ['taxonomy', 'categories'],
    queryFn: () => taxonomyService.getCategories(),
  });
  const { data: brandsRes } = useQuery({
    queryKey: ['taxonomy', 'brands'],
    queryFn: () => taxonomyService.getBrands(),
  });
  const { data: ageGroupsRes } = useQuery({
    queryKey: ['taxonomy', 'age-groups'],
    queryFn: () => taxonomyService.getAgeGroups(),
  });

  const categories = categoriesRes?.data || [];
  const brands = brandsRes?.data || [];
  const ageGroups = ageGroupsRes?.data || [];

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (payload: Partial<Product>) => {
      const images = (payload.images || [])
        .map((img) => img?.file)
        .filter((f): f is File => f instanceof File);
      return isEdit
        ? productService.updateProduct(id!, payload, images)
        : productService.createProduct(payload, images);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(isEdit ? 'تم تحديث بيانات اللعبة بنجاح' : 'تم إضافة اللعبة الجديدة إلى الكتالوج');
      navigate('/products');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'حدث خطأ أثناء حفظ اللعبة');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && loadError) return;
    if (!localizedText(formData.name).trim()) {
      toast.error('يرجى إدخال اسم اللعبة باللغة العربية');
      setActiveSection('basic');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('يرجى تحديد سعر البيع');
      setActiveSection('pricing');
      return;
    }

    saveMutation.mutate(formData);
  };

  // Variants handlers
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now(),
      sku: `${formData.sku || 'SKU'}-V${(formData.variants?.length || 0) + 1}`,
      name: { ar: 'لون / موديل جديد', en: 'New Color/Model' },
      price: formData.price || 0,
      cost_price: formData.cost_price || 0,
      stock: 5,
    };
    setFormData((prev) => ({
      ...prev,
      has_variants: true,
      variants: [...(prev.variants || []), newVariant],
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateVariant = (index: number, partial: Partial<ProductVariant>) => {
    setFormData((prev) => {
      const updated = [...(prev.variants || [])];
      updated[index] = { ...updated[index], ...partial };
      return { ...prev, variants: updated };
    });
  };

  if (isEdit && loading) {
    return <PageLoader label="جاري تحميل المنتج..." />;
  }

  if (isEdit && loadError) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <EmptyState
          icon={AlertTriangle}
          message="تعذر تحميل المنتج"
          description="الخادم غير قادر على تحميل بيانات هذا المنتج حالياً. قد تكون مشكلة مؤقتة."
        />
        <div className="flex gap-3 justify-center mt-6">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            رجوع للقائمة
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'basic', label: 'البيانات الأساسية', icon: Package },
    { id: 'pricing', label: 'التسعير والتكلفة', icon: DollarSign },
    { id: 'toys', label: 'مواصفات الألعاب والأمان', icon: ShieldAlert },
    { id: 'variants', label: 'الموديلات والخيارات (Variants)', icon: Layers },
    { id: 'media', label: 'الصور والوسائط', icon: ImageIcon },
    { id: 'taxonomy', label: 'التصنيف والفئات العمرية', icon: Sparkles },
    { id: 'seo', label: 'تهيئة محركات البحث (SEO)', icon: Sparkles },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isEdit ? 'تعديل بيانات اللعبة' : 'إضافة لعبة جديدة'}
            </h1>
            <p className="text-xs text-slate-500">
              {localizedText(formData.name) || 'يرجى إكمال الحقول الإلزامية لحفظ المنتج'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status selector */}
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
          >
            <option value="active">نشط في المتجر</option>
            <option value="draft">مسودة (غير معروض)</option>
            <option value="archived">مؤرشف</option>
          </select>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-70"
          >
            {saveMutation.isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>حفظ اللعبة</span>
          </button>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        {/* Section 1: Basic Info */}
        {activeSection === 'basic' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              البيانات الأساسية للعبة
            </h2>

            <LocalizedField
              label="اسم اللعبة"
              required
              value={formData.name || { ar: '', en: '' }}
              onChange={(name) => setFormData({ ...formData, name })}
              placeholderAr="مثال: مجموعة ليجو قلعة المغامرات..."
              placeholderEn="e.g. Lego Adventure Castle Set..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  كود المنتج الفريد (SKU)
                </label>
                <input
                  type="text"
                  value={formData.sku || ''}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="TOY-1002"
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الباركود الدولي (Barcode / EAN)
                </label>
                <input
                  type="text"
                  value={formData.barcode || ''}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="6221234567890"
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <LocalizedField
              label="الوصف المختصر (يظهر في كروت العرض)"
              isTextarea
              rows={2}
              value={formData.short_description || { ar: '', en: '' }}
              onChange={(short_description) => setFormData({ ...formData, short_description })}
            />

            <LocalizedField
              label="الوصف التفصيلي وشرح طريقة اللعب"
              isTextarea
              rows={5}
              value={formData.description || { ar: '', en: '' }}
              onChange={(description) => setFormData({ ...formData, description })}
            />
          </div>
        )}

        {/* Section 2: Pricing */}
        {activeSection === 'pricing' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              التسعير وتكلفة الشراء والضرائب
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  سعر البيع الأساسي (ج.م) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  سعر الخصم / العرض (اختياري)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.discount_price || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_price: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="سعر أقل أثناء التخفيضات"
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تكلفة الشراء (Cost Price)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.cost_price || ''}
                  onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">تستخدم لحساب أرباح المتجر بدقة</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نسبة ضريبة القيمة المضافة (%)
                </label>
                <input
                  type="number"
                  value={formData.tax_rate || 14}
                  onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  رصيد المخزن الحالي
                </label>
                <input
                  type="number"
                  value={formData.stock || 0}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  حد التنبيه بنفاد المخزون (Low Stock)
                </label>
                <input
                  type="number"
                  value={formData.low_stock_threshold || 5}
                  onChange={(e) =>
                    setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 text-amber-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Toy Specifics */}
        {activeSection === 'toys' && (
          <div className="space-y-5 max-w-3xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              حقول ألعاب الأطفال وشروط السلامة المعتمدة
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  العمر الأدنى (سنوات)
                </label>
                <input
                  type="number"
                  value={formData.toy_details?.age_range_min || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      toy_details: {
                        ...formData.toy_details!,
                        age_range_min: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  العمر الأقصى (سنوات)
                </label>
                <input
                  type="number"
                  value={formData.toy_details?.age_range_max || 12}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      toy_details: {
                        ...formData.toy_details!,
                        age_range_max: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الجنس المستهدف
                </label>
                <select
                  value={formData.toy_details?.target_gender || 'unisex'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      toy_details: {
                        ...formData.toy_details!,
                        target_gender: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <option value="unisex">للجنسين (أولاد وبنات)</option>
                  <option value="boys">أولاد</option>
                  <option value="girls">بنات</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عدد القطع (Piece Count)
                </label>
                <input
                  type="number"
                  value={formData.toy_details?.piece_count || 1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      toy_details: {
                        ...formData.toy_details!,
                        piece_count: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  خامات التصنيع الرئيسية
                </label>
                <input
                  type="text"
                  value={formData.toy_details?.materials?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      toy_details: {
                        ...formData.toy_details!,
                        materials: e.target.value.split(',').map((s) => s.trim()),
                      },
                    })
                  }
                  placeholder="خشب زان طبيعي، بلاستيك ABS آمن..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Batteries & Safety */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl space-y-4 border border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.toy_details?.requires_batteries || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      toy_details: {
                        ...formData.toy_details!,
                        requires_batteries: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  تحتاج بطاريات لتشغيل المؤثرات أو الحركة
                </span>
              </label>

              {formData.toy_details?.requires_batteries && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ps-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      نوع البطاريات المطلوبة
                    </label>
                    <input
                      type="text"
                      value={formData.toy_details?.battery_type || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          toy_details: {
                            ...formData.toy_details!,
                            battery_type: e.target.value,
                          },
                        })
                      }
                      placeholder="3x AA / بطارية ليثيوم قابلة للشحن"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formData.toy_details?.batteries_included || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            toy_details: {
                              ...formData.toy_details!,
                              batteries_included: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-blue-600 w-3.5 h-3.5"
                      />
                      <span>البطاريات مشمولة في العلبة مجاناً</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Choking hazard warning */}
              <label className="flex items-center gap-2 cursor-pointer select-none pt-2 border-t border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={formData.toy_details?.choking_hazard || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      toy_details: {
                        ...formData.toy_details!,
                        choking_hazard: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-red-600 w-4 h-4"
                />
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  تحذير: تحتوي على قطع صغيرة (خطر الاختناق للأطفال أقل من 3 سنوات)
                </span>
              </label>

              <LocalizedField
                label="تحذيرات السلامة والاستخدام للأهل"
                isTextarea
                rows={2}
                value={
                  formData.toy_details?.safety_warnings || {
                    ar: 'غير مناسب للأطفال دون 3 سنوات.',
                    en: 'Not suitable for children under 3 years.',
                  }
                }
                onChange={(safety_warnings) =>
                  setFormData({
                    ...formData,
                    toy_details: {
                      ...formData.toy_details!,
                      safety_warnings,
                    },
                  })
                }
              />
            </div>
          </div>
        )}

        {/* Section 4: Variants */}
        {activeSection === 'variants' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  الموديلات والخيارات (Variants)
                </h2>
                <p className="text-xs text-slate-500">
                  إضافة ألوان، أحجام أو إصدارات بـ SKU وسعر ومخزون منفصل
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة موديل جديد</span>
              </button>
            </div>

            {(!formData.variants || formData.variants.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">
                هذه اللعبة لا تحتوي على موديلات فرعية بعد. انقر على الزر أعلاه لإضافة أول موديل (مثل لون أحمر/أزرق).
              </div>
            ) : (
              <div className="space-y-3">
                {formData.variants.map((v, idx) => (
                  <div
                    key={v.id || idx}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-3 items-center"
                  >
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        اسم الموديل (عربي / English)
                      </label>
                      <input
                        type="text"
                        value={localizedText(v.name)}
                        onChange={(e) =>
                          updateVariant(idx, {
                            name: {
                              ar: e.target.value,
                              en: (typeof v.name === 'string' ? v.name : v.name?.en) || e.target.value,
                            },
                          })
                        }
                        placeholder="أزرق كربوني"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        السعر / المخزون
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })}
                          placeholder="السعر"
                          className="w-1/2 px-2 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
                        />
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })}
                          placeholder="العدد"
                          className="w-1/2 px-2 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden text-emerald-600"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                        title="حذف هذا الموديل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 5: Media */}
        {activeSection === 'media' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              صور وفيديوهات اللعبة
            </h2>

            <ImageUploader
              images={formData.images || []}
              onChange={(images) => setFormData({ ...formData, images })}
              maxFiles={8}
            />

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                رابط فيديو يوتيوب توضيحي (YouTube Video URL)
              </label>
              <input
                type="url"
                value={formData.video_url || ''}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Section 6: Taxonomy */}
        {activeSection === 'taxonomy' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              التصنيف والعلامة التجارية والفئة العمرية
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                القسم الرئيسي *
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value, category_ids: e.target.value ? [e.target.value] : [] })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              >
                <option value="">اختر القسم...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {localizedText(c.name, isAr ? 'ar' : 'en')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                العلامة التجارية (Brand)
              </label>
              <select
                value={formData.brand_id || ''}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              >
                <option value="">اختر الماركة...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الفئة العمرية الموصى بها
              </label>
              <select
                value={formData.age_group_id || ''}
                onChange={(e) => setFormData({ ...formData, age_group_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              >
                <option value="">اختر الفئة العمرية...</option>
                {ageGroups.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {localizedText(ag.name, isAr ? 'ar' : 'en')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Section 7: SEO */}
        {activeSection === 'seo' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              تحسين محركات البحث (SEO)
            </h2>

            <LocalizedField
              label="عنوان الصفحة المخصص (Meta Title)"
              value={formData.meta_title || { ar: '', en: '' }}
              onChange={(meta_title) => setFormData({ ...formData, meta_title })}
              placeholderAr="مجموعة ليجو قلعة المغامرات | اشتري ألعاب أطفال أونلاين"
            />

            <LocalizedField
              label="وصف الميتا لمحركات البحث (Meta Description)"
              isTextarea
              rows={3}
              value={formData.meta_description || { ar: '', en: '' }}
              onChange={(meta_description) => setFormData({ ...formData, meta_description })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الكلمات المفتاحية (مفصولة بفواصل)
              </label>
              <input
                type="text"
                value={formData.meta_keywords || ''}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                placeholder="ألعاب ليجو، قلعة أطفال، تنمية مهارات، ألعاب تركيب"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default ProductFormPage;
