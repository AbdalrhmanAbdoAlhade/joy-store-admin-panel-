import apiClient, { ApiResponse } from '@/src/lib/axios';
import { Category, Brand, AgeGroup, Tag } from '@/src/types/product';
import { toNumber, ensureArray, flattenTree, localizedText } from '@/src/lib/api-helpers';

function appendIf(fd: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null || value === '') return;
  fd.append(key, String(value));
}

function makeSlug(name: unknown, fallbackPrefix: string): string {
  const source = typeof name === 'object' && name !== null
    ? ((name as any).en || (name as any).ar || '')
    : name;
  const slug = String(source || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `${fallbackPrefix}-${Date.now()}`;
}

function buildCategoryFormData(payload: Partial<Category>, image?: File): FormData {
  const fd = new FormData();
  fd.append('name', localizedText(payload.name));
  fd.append('slug', payload.slug || makeSlug(payload.name, 'cat'));
  appendIf(fd, 'parent_id', payload.parent_id);
  appendIf(fd, 'description', localizedText(payload.description));
  appendIf(fd, 'sort_order', payload.order);
  fd.append('is_active', payload.is_active === false ? '0' : '1');
  if (image) fd.append('image', image);
  return fd;
}

function buildBrandFormData(payload: Partial<Brand>, logo?: File): FormData {
  const fd = new FormData();
  fd.append('name', localizedText(payload.name));
  fd.append('slug', payload.slug || makeSlug(payload.name, 'brand'));
  appendIf(fd, 'description', localizedText(payload.description));
  appendIf(fd, 'website', payload.website);
  fd.append('is_active', payload.is_active === false ? '0' : '1');
  if (logo) fd.append('logo', logo);
  return fd;
}

function normalizeCategory(c: any): Category {
  return {
    id: c?.id ?? '',
    name: c?.name ?? '',
    slug: c?.slug ?? '',
    description: c?.description ?? undefined,
    image: c?.image ?? undefined,
    parent_id: c?.parent_id ?? null,
    is_active: c?.is_active ?? true,
    order: c?.sort_order ?? c?.order,
    products_count: c?.products_count,
  };
}

function normalizeBrand(b: any): Brand {
  return {
    id: b?.id ?? '',
    name: b?.name ?? '',
    slug: b?.slug ?? '',
    logo: b?.logo ?? undefined,
    description: b?.description ?? undefined,
    website: b?.website ?? undefined,
    is_active: b?.is_active ?? true,
    products_count: b?.products_count,
  };
}

function normalizeAgeGroup(a: any): AgeGroup {
  const min = toNumber(a?.min_age);
  const max = a?.max_age != null ? toNumber(a?.max_age) : 0;
  const unit = a?.age_unit || (max && max <= 36 ? 'months' : 'years');
  return {
    id: a?.id ?? '',
    name: a?.name ?? '',
    slug: a?.slug ?? `age-${a?.id}`,
    min_age: min,
    max_age: max,
    age_unit: unit,
    badge_color: a?.badge_color,
    is_active: a?.is_active ?? true,
    products_count: a?.products_count,
  };
}

function normalizeTag(t: any): Tag {
  return {
    id: t?.id ?? '',
    name: t?.name ?? '',
    slug: t?.slug ?? '',
    color: t?.color,
    products_count: t?.products_count,
  };
}

// Initial Mock Taxonomy
let mockCategories: Category[] = [
  {
    id: 1,
    name: { ar: 'ألعاب البناء والتركيب', en: 'Building & Construction Toys' },
    slug: 'building-construction',
    is_active: true,
    order: 1,
    products_count: 42,
    children: [
      { id: 11, name: { ar: 'مجموعات الليجو والقطع', en: 'Lego & Blocks' }, slug: 'lego-blocks', is_active: true, parent_id: 1, products_count: 28 },
      { id: 12, name: { ar: 'المكعبات الخشبية', en: 'Wooden Blocks' }, slug: 'wooden-blocks', is_active: true, parent_id: 1, products_count: 14 },
    ],
  },
  {
    id: 2,
    name: { ar: 'الدمى والشخصيات المحشوة', en: 'Dolls & Plush Toys' },
    slug: 'dolls-plush',
    is_active: true,
    order: 2,
    products_count: 36,
  },
  {
    id: 3,
    name: { ar: 'المركبات وسيارات التحكم عن بعد', en: 'Vehicles & RC Cars' },
    slug: 'vehicles-rc',
    is_active: true,
    order: 3,
    products_count: 51,
  },
  {
    id: 4,
    name: { ar: 'الألعاب التعليمية وSTEM', en: 'Educational & STEM' },
    slug: 'educational-stem',
    is_active: true,
    order: 4,
    products_count: 29,
  },
  {
    id: 5,
    name: { ar: 'ألعاب الرضع والمواليد', en: 'Baby & Toddler Toys' },
    slug: 'baby-toddler',
    is_active: true,
    order: 5,
    products_count: 20,
  },
];

let mockBrands: Brand[] = [
  { id: 1, name: 'LEGO', slug: 'lego', is_active: true, products_count: 28 },
  { id: 2, name: 'Fisher-Price', slug: 'fisher-price', is_active: true, products_count: 34 },
  { id: 3, name: 'Hot Wheels', slug: 'hot-wheels', is_active: true, products_count: 40 },
  { id: 4, name: 'Melissa & Doug', slug: 'melissa-doug', is_active: true, products_count: 19 },
  { id: 5, name: 'Barbie / Mattel', slug: 'barbie-mattel', is_active: true, products_count: 25 },
];

let mockAgeGroups: AgeGroup[] = [
  { id: 1, name: { ar: 'حديثو الولادة (0 - 12 شهر)', en: '0 - 12 Months' }, slug: '0-12m', min_age: 0, max_age: 12, age_unit: 'months', badge_color: '#3B82F6', is_active: true, products_count: 24 },
  { id: 2, name: { ar: 'الأطفال الصغار (1 - 3 سنوات)', en: '1 - 3 Years' }, slug: '1-3y', min_age: 1, max_age: 3, age_unit: 'years', badge_color: '#10B981', is_active: true, products_count: 45 },
  { id: 3, name: { ar: 'ما قبل المدرسة (3 - 5 سنوات)', en: '3 - 5 Years' }, slug: '3-5y', min_age: 3, max_age: 5, age_unit: 'years', badge_color: '#F59E0B', is_active: true, products_count: 60 },
  { id: 4, name: { ar: 'سن المدرسة (6 - 8 سنوات)', en: '6 - 8 Years' }, slug: '6-8y', min_age: 6, max_age: 8, age_unit: 'years', badge_color: '#EC4899', is_active: true, products_count: 52 },
  { id: 5, name: { ar: 'الناشئون (9 - 12+ سنة)', en: '9 - 12+ Years' }, slug: '9-12y', min_age: 9, max_age: 14, age_unit: 'years', badge_color: '#8B5CF6', is_active: true, products_count: 38 },
];

let mockTags: Tag[] = [
  { id: 1, name: { ar: 'أكثر مبيعاً', en: 'Best Seller' }, slug: 'best-seller', color: '#EF4444', products_count: 15 },
  { id: 2, name: { ar: 'وصل حديثاً', en: 'New Arrival' }, slug: 'new-arrival', color: '#10B981', products_count: 22 },
  { id: 3, name: { ar: 'صديق للبيئة وخشب طبيعي', en: 'Eco-Friendly' }, slug: 'eco-friendly', color: '#059669', products_count: 8 },
  { id: 4, name: { ar: 'تنمية الذكاء الخارق', en: 'Brain Booster' }, slug: 'brain-booster', color: '#6366F1', products_count: 19 },
];

export const taxonomyService = {
  // Categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const response = await apiClient.get<any>('/admin/categories');
      const res = response.data;
      const rows = Array.isArray(res) ? res : ensureArray(res?.data);
      const flat = flattenTree(rows).map(normalizeCategory);
      return { success: true, data: flat };
    } catch {
      return { success: true, data: flattenTree(mockCategories).map(normalizeCategory) };
    }
  },

  async createCategory(payload: Partial<Category>, image?: File): Promise<ApiResponse<Category>> {
    try {
      const response = await apiClient.post<any>('/admin/categories', buildCategoryFormData(payload, image));
      const res = response.data;
      return { success: true, message: 'تم إنشاء القسم بنجاح', data: normalizeCategory(res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      const newCat: Category = {
        id: Date.now(),
        name: payload.name || { ar: 'تصنيف جديد', en: 'New Category' },
        slug: payload.slug || `cat-${Date.now()}`,
        parent_id: payload.parent_id || null,
        order: mockCategories.length + 1,
        is_active: payload.is_active ?? true,
        products_count: 0,
      };
      if (newCat.parent_id) {
        const parent = mockCategories.find((c) => c.id === newCat.parent_id);
        if (parent) {
          parent.children = [...(parent.children || []), newCat];
        }
      } else {
        mockCategories.push(newCat);
      }
      return { success: true, message: 'تم إنشاء القسم بنجاح', data: newCat };
    }
  },

  async updateCategory(id: number | string, payload: Partial<Category>, image?: File): Promise<ApiResponse<Category>> {
    try {
      // Backend requires POST (not PUT) + multipart/form-data for /admin/categories/:id
      const response = await apiClient.post<any>(`/admin/categories/${id}`, buildCategoryFormData(payload, image));
      const res = response.data;
      return { success: true, message: 'تم تحديث بيانات القسم', data: normalizeCategory(res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      mockCategories = mockCategories.map((c) => (c.id === id ? { ...c, ...payload } : c));
      const updated = mockCategories.find((c) => c.id === id)!;
      return { success: true, message: 'تم تحديث بيانات القسم', data: updated };
    }
  },

  async deleteCategory(id: number | string): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.delete<any>(`/admin/categories/${id}`);
      return { success: true, message: 'تم حذف القسم بنجاح', data: null };
    } catch {
      mockCategories = mockCategories.filter((c) => c.id !== id);
      return { success: true, message: 'تم حذف القسم بنجاح', data: null };
    }
  },

  async reorderCategories(tree: { id: number | string; order: number; parent_id?: number | string | null }[]): Promise<ApiResponse<null>> {
    // Endpoint not available in backend
    // const response = await apiClient.post<any>('/admin/categories/reorder', { tree });
    // return response.data;
    void tree;
    return { success: false, message: 'قريباً', data: null };
  },

  // Brands
  async getBrands(): Promise<ApiResponse<Brand[]>> {
    try {
      const response = await apiClient.get<any>('/admin/brands');
      const res = response.data;
      const rows = Array.isArray(res) ? res : ensureArray(res?.data);
      return { success: true, data: rows.map(normalizeBrand) };
    } catch {
      return { success: true, data: mockBrands.map(normalizeBrand) };
    }
  },

  async createBrand(payload: Partial<Brand>, logo?: File): Promise<ApiResponse<Brand>> {
    try {
      const response = await apiClient.post<any>('/admin/brands', buildBrandFormData(payload, logo));
      const res = response.data;
      return { success: true, message: 'تمت إضافة العلامة التجارية بنجاح', data: normalizeBrand(res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      const newBrand: Brand = {
        id: Date.now(),
        name: payload.name || 'ماركة جديدة',
        slug: payload.slug || `brand-${Date.now()}`,
        is_active: payload.is_active ?? true,
        products_count: 0,
      };
      mockBrands.push(newBrand);
      return { success: true, message: 'تمت إضافة العلامة التجارية بنجاح', data: newBrand };
    }
  },

  async updateBrand(id: number | string, payload: Partial<Brand>, logo?: File): Promise<ApiResponse<Brand>> {
    try {
      // Backend requires POST (not PUT) + multipart/form-data for /admin/brands/:id
      const response = await apiClient.post<any>(`/admin/brands/${id}`, buildBrandFormData(payload, logo));
      const res = response.data;
      return { success: true, message: 'تم تحديث العلامة التجارية', data: normalizeBrand(res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      mockBrands = mockBrands.map((b) => (String(b.id) === String(id) ? { ...b, ...payload } : b));
      return { success: true, message: 'تم تحديث العلامة التجارية', data: mockBrands.find((b) => String(b.id) === String(id))! };
    }
  },

  async deleteBrand(id: number | string): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.delete<any>(`/admin/brands/${id}`);
      return { success: true, message: 'تم حذف العلامة التجارية', data: null };
    } catch {
      mockBrands = mockBrands.filter((b) => b.id !== id);
      return { success: true, message: 'تم حذف العلامة التجارية', data: null };
    }
  },

  // Age Groups
  async getAgeGroups(): Promise<ApiResponse<AgeGroup[]>> {
    try {
      const response = await apiClient.get<any>('/admin/age-groups');
      const res = response.data;
      const rows = Array.isArray(res) ? res : ensureArray(res?.data);
      return { success: true, data: rows.map(normalizeAgeGroup) };
    } catch {
      return { success: true, data: mockAgeGroups.map(normalizeAgeGroup) };
    }
  },

  async createAgeGroup(payload: Partial<AgeGroup>): Promise<ApiResponse<AgeGroup>> {
    try {
      // JSON (not form-data). `name` is a flat string; ages are in months.
      const response = await apiClient.post<any>('/admin/age-groups', {
        name: localizedText(payload.name),
        min_age: toNumber(payload.min_age),
        max_age: payload.max_age !== undefined && payload.max_age !== null ? toNumber(payload.max_age) : null,
        sort_order: payload.sort_order ?? 0,
        is_active: payload.is_active ?? true,
      });
      const res = response.data;
      return { success: true, message: 'تمت إضافة الفئة العمرية', data: normalizeAgeGroup(res.age_group || res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      const newAge: AgeGroup = {
        id: Date.now(),
        name: payload.name || { ar: 'فئة جديدة', en: 'New Age Group' },
        slug: payload.slug || `age-${Date.now()}`,
        min_age: payload.min_age || 1,
        max_age: payload.max_age || 3,
        age_unit: payload.age_unit || 'years',
        is_active: true,
        products_count: 0,
      };
      mockAgeGroups.push(newAge);
      return { success: true, message: 'تمت إضافة الفئة العمرية', data: newAge };
    }
  },

  async updateAgeGroup(id: number | string, payload: Partial<AgeGroup>): Promise<ApiResponse<AgeGroup>> {
    try {
      // JSON (no image). `name` is a flat string; ages are in months.
      const response = await apiClient.put<any>(`/admin/age-groups/${id}`, {
        name: localizedText(payload.name),
        min_age: toNumber(payload.min_age),
        max_age: payload.max_age !== undefined && payload.max_age !== null ? toNumber(payload.max_age) : null,
        sort_order: payload.sort_order,
        is_active: payload.is_active ?? true,
      });
      const res = response.data;
      return { success: true, message: 'تم تحديث الفئة العمرية', data: normalizeAgeGroup(res.age_group || res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      mockAgeGroups = mockAgeGroups.map((a) => (String(a.id) === String(id) ? { ...a, ...payload } : a));
      return { success: true, message: 'تم تحديث الفئة العمرية', data: mockAgeGroups.find((a) => String(a.id) === String(id))! };
    }
  },

  async deleteAgeGroup(id: number | string): Promise<ApiResponse<null>> {
    try {
      await apiClient.delete<any>(`/admin/age-groups/${id}`);
      return { success: true, message: 'تم حذف الفئة العمرية', data: null };
    } catch (err: any) {
      if (err?.response) throw err;
      mockAgeGroups = mockAgeGroups.filter((a) => String(a.id) !== String(id));
      return { success: true, message: 'تم حذف الفئة العمرية', data: null };
    }
  },

  // Tags
  async getTags(): Promise<ApiResponse<Tag[]>> {
    // Endpoint not available in backend
    // const response = await apiClient.get<ApiResponse<Tag[]>>('/tags');
    // return response.data;
    void mockTags;
    void normalizeTag;
    return { success: true, message: 'قريباً', data: [] };
  },
};

export default taxonomyService;
