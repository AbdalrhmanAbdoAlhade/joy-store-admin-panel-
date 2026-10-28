import apiClient, { ApiResponse } from '@/src/lib/axios';
import { Product, ProductVariant, ProductImage } from '@/src/types/product';
import { TableQueryParams } from '@/src/types/api';
import { toNumber, ensureArray, localizedText, cleanQueryParams, resolveMediaUrl } from '@/src/lib/api-helpers';

// The API sometimes serializes a single-item relation as an object instead of
// an array (observed on /staff/products/1 for `categories` and `variants`).
function asList<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') return [value as T];
  return [];
}

function normalizeImages(value: any): ProductImage[] {
  return asList<any>(value).map((img, idx) => {
    if (typeof img === 'string') {
      return { id: `img_${idx}`, url: resolveMediaUrl(img) ?? '', order: idx, is_primary: idx === 0 };
    }
    const rawUrl = img?.url || img?.image_url || img?.path || img?.image;
    return {
      ...img,
      id: img?.id ?? `img_${idx}`,
      url: resolveMediaUrl(rawUrl) ?? '',
      order: img?.order ?? idx,
      is_primary: img?.is_primary ?? idx === 0,
    } as ProductImage;
  });
}

// The list endpoint omits `images` and exposes `primary_image` instead, while
// the detail endpoint returns `images` (array or single object). Accept both.
function extractImages(raw: any): ProductImage[] {
  const candidates = [
    raw?.images,
    raw?.product_images,
    raw?.primary_image,
    raw?.image,
    raw?.thumbnail,
  ];

  for (const candidate of candidates) {
    const list = Array.isArray(candidate)
      ? candidate
      : typeof candidate === 'string'
        ? candidate.trim()
          ? [candidate]
          : []
        : candidate && typeof candidate === 'object'
          ? [candidate]
          : [];
    if (list.length) return normalizeImages(list);
  }

  return [];
}

function normalizeProduct(p: any): Product {
  const rawVariants = asList<any>(p?.variants);
  const variants: ProductVariant[] = rawVariants.map((v: any) => ({
    id: v?.id,
    sku: v?.sku ?? '',
    name: v?.name ?? '',
    price: toNumber(v?.price),
    sale_price: v?.sale_price != null ? toNumber(v?.sale_price) : undefined,
    cost_price: toNumber(v?.cost_price),
    stock: toNumber(v?.stock ?? v?.available_stock),
    barcode: v?.barcode ?? undefined,
    attributes: v?.attributes ?? undefined,
  }));
  const stock = variants.length
    ? variants.reduce((acc, v) => acc + toNumber(v.stock), 0)
    : toNumber(p?.stock);
  const categories = asList<any>(p?.categories);
  const primaryCategory = categories[0];

  return {
    id: p?.id ?? '',
    name: p?.name ?? '',
    slug: p?.slug ?? '',
    description: p?.description ?? '',
    short_description: p?.short_description ?? undefined,
    sku: p?.sku ?? '',
    barcode: p?.barcode ?? undefined,
    status: p?.status ?? 'draft',
    price: toNumber(p?.price),
    discount_price: p?.sale_price != null ? toNumber(p?.sale_price) : p?.discount_price != null ? toNumber(p?.discount_price) : undefined,
    cost_price: toNumber(p?.cost_price),
    tax_rate: toNumber(p?.tax_rate),
    stock,
    low_stock_threshold: toNumber(p?.low_stock_threshold) || 5,
    category_id: primaryCategory?.id ?? p?.category_id,
    category_ids: categories.map((c: any) => c?.id).filter((v: any) => v !== undefined),
    category: primaryCategory
      ? { id: primaryCategory.id, name: primaryCategory.name, slug: primaryCategory.slug ?? '', is_active: primaryCategory.is_active ?? true }
      : undefined,
    brand_id: p?.brand?.id ?? p?.brand_id,
    brand: p?.brand
      ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug ?? '', is_active: true }
      : undefined,
    age_group_id: p?.age_group?.id ?? p?.age_group_id,
    images: extractImages(p),
    video_url: p?.video_url ?? undefined,
    has_variants: rawVariants.length > 0,
    variants,
    toy_details: {
      age_range_min: p?.age_range_min ?? undefined,
      age_range_max: p?.age_range_max ?? undefined,
      target_gender: p?.gender ?? undefined,
      materials: p?.material ? [p.material] : [],
      requires_batteries: Boolean(p?.battery_required),
      batteries_included: Boolean(p?.batteries_included),
      choking_hazard: Boolean(p?.choking_hazard),
      safety_warnings: p?.safety_warnings ?? undefined,
      certifications: ensureArray(p?.certifications),
      piece_count: p?.pieces_count != null ? toNumber(p?.pieces_count) : undefined,
    },
    meta_title: p?.meta_title ?? undefined,
    meta_description: p?.meta_description ?? undefined,
    created_at: p?.created_at,
    updated_at: p?.updated_at,
  };
}

// Realistic mock toys catalogue for fallback
const INITIAL_MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: { ar: 'مجموعة ليجو قلعة المغامرات الإبداعية', en: 'Lego Creative Adventure Castle' },
    slug: 'lego-creative-adventure-castle',
    description: {
      ar: 'مجموعة بناء متكاملة لتنمية خيال الطفل ومهارات التفكير المكاني، تحتوي على 750 قطعة آمنة للأطفال.',
      en: 'Complete building set to spark child imagination and spatial thinking, featuring 750 child-safe blocks.',
    },
    sku: 'TOY-LEGO-001',
    barcode: '6221234567890',
    status: 'active',
    price: 1850,
    discount_price: 1599,
    cost_price: 1100,
    tax_rate: 14,
    stock: 45,
    low_stock_threshold: 10,
    category_id: 1,
    brand_id: 1,
    age_group_id: 2,
    has_variants: true,
    variants: [
      { id: 101, sku: 'TOY-LEGO-001-STD', name: { ar: 'الإصدار القياسي', en: 'Standard Edition' }, price: 1599, cost_price: 1100, stock: 30 },
      { id: 102, sku: 'TOY-LEGO-001-DLX', name: { ar: 'الإصدار المميز + شخصيات إضافية', en: 'Deluxe Edition + Extra Minifigures' }, price: 1999, cost_price: 1350, stock: 15 },
    ],
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80', order: 0, is_primary: true },
      { id: 2, url: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=600&q=80', order: 1 },
    ],
    toy_details: {
      age_range_min: 5,
      age_range_max: 12,
      target_gender: 'unisex',
      materials: ['ABS Plastic (BPA-Free)'],
      requires_batteries: false,
      choking_hazard: true,
      piece_count: 750,
      safety_warnings: { ar: 'تحذير: قطع صغيرة قد تسبب الاختناق للأطفال دون سن 3 سنوات.', en: 'Warning: Small parts, choking hazard for children under 3 years.' },
      certifications: ['EN71', 'ASTM F963', 'CE'],
    },
    created_at: '2026-03-10T10:00:00Z',
    updated_at: '2026-03-15T12:00:00Z',
  },
  {
    id: 2,
    name: { ar: 'دمية دب محشو قطيفة فائق النعومة 60 سم', en: 'Ultra Soft Plush Teddy Bear 60cm' },
    slug: 'ultra-soft-plush-teddy-bear-60cm',
    description: {
      ar: 'دب دمية من الصوف العضوي المضاد للحساسية وآمن لحديثي الولادة والأطفال الرضع.',
      en: 'Hypoallergenic organic plush teddy bear safe for newborns and toddlers.',
    },
    sku: 'TOY-BEAR-002',
    barcode: '6221234567891',
    status: 'active',
    price: 450,
    cost_price: 260,
    tax_rate: 14,
    stock: 8,
    low_stock_threshold: 15,
    category_id: 2,
    brand_id: 2,
    age_group_id: 1,
    has_variants: false,
    images: [
      { id: 3, url: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80', order: 0, is_primary: true },
    ],
    toy_details: {
      age_range_min: 0,
      age_range_max: 6,
      target_gender: 'unisex',
      materials: ['Organic Cotton', 'Hypoallergenic Polyfill'],
      requires_batteries: false,
      choking_hazard: false,
      safety_warnings: { ar: 'آمن تماماً لحديثي الولادة والرضع.', en: 'Completely safe for newborns.' },
      certifications: ['OEKO-TEX 100', 'CE'],
    },
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-12T12:00:00Z',
  },
  {
    id: 3,
    name: { ar: 'سيارة دفع رباعي تحكم عن بعد 4WD مع إضاءة LED', en: 'RC 4WD Monster Truck with LED' },
    slug: 'rc-4wd-monster-truck-led',
    description: {
      ar: 'سيارة صلبة مقاومة للصدمات بسرعة تصل إلى 30 كم/ساعة وبطارية قابلة لإعادة الشحن عبر USB.',
      en: 'Shock-resistant rugged RC truck reaching 30 km/h with rechargeable USB lithium battery.',
    },
    sku: 'TOY-RC-003',
    barcode: '6221234567892',
    status: 'active',
    price: 1250,
    discount_price: 990,
    cost_price: 650,
    tax_rate: 14,
    stock: 22,
    low_stock_threshold: 8,
    category_id: 3,
    brand_id: 3,
    age_group_id: 3,
    has_variants: true,
    variants: [
      { id: 103, sku: 'TOY-RC-003-RED', name: { ar: 'أحمر ناري', en: 'Flame Red' }, price: 990, cost_price: 650, stock: 12 },
      { id: 104, sku: 'TOY-RC-003-BLU', name: { ar: 'أزرق كربوني', en: 'Carbon Blue' }, price: 990, cost_price: 650, stock: 10 },
    ],
    images: [
      { id: 4, url: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=600&q=80', order: 0, is_primary: true },
    ],
    toy_details: {
      age_range_min: 6,
      age_range_max: 14,
      target_gender: 'boys',
      materials: ['Reinforced ABS', 'Rubber tires'],
      requires_batteries: true,
      battery_type: '7.4V Li-ion + 2x AA for Remote',
      batteries_included: true,
      choking_hazard: false,
      safety_warnings: { ar: 'لا تستخدم قرب الشوارع المزدحمة بالسيارات.', en: 'Do not operate near real traffic.' },
      certifications: ['CE', 'RoHS'],
    },
    created_at: '2026-02-20T10:00:00Z',
    updated_at: '2026-03-05T12:00:00Z',
  },
  {
    id: 4,
    name: { ar: 'مجموعة تجارب علمية وميكروسكوب الأطفال 1200x', en: 'Children Science Lab & Microscope 1200x' },
    slug: 'children-science-lab-microscope',
    description: {
      ar: 'مجهر بصري للأطفال بـ 3 عدسات تكبيرية مع شرائح زجاجية جاهزة وأدوات تشريح آمنة.',
      en: 'Junior optical microscope with 3 magnification levels, prepared specimen slides, and safe lab tools.',
    },
    sku: 'TOY-EDU-004',
    barcode: '6221234567893',
    status: 'draft',
    price: 890,
    cost_price: 520,
    tax_rate: 14,
    stock: 0,
    low_stock_threshold: 10,
    category_id: 4,
    brand_id: 4,
    age_group_id: 3,
    has_variants: false,
    images: [
      { id: 5, url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80', order: 0, is_primary: true },
    ],
    toy_details: {
      age_range_min: 8,
      age_range_max: 16,
      target_gender: 'unisex',
      materials: ['Optical Acrylic', 'Durable Polymer'],
      requires_batteries: true,
      battery_type: '2x AA for LED Light',
      batteries_included: false,
      choking_hazard: true,
      piece_count: 28,
      safety_warnings: { ar: 'يستخدم تحت إشراف شخص بالغ لوجود أدوات فحص دقيقة.', en: 'Use under adult supervision.' },
      certifications: ['ISO 8124', 'CE'],
    },
    created_at: '2026-03-14T10:00:00Z',
    updated_at: '2026-03-14T10:00:00Z',
  },
];

let localProducts = [...INITIAL_MOCK_PRODUCTS];

function appendIf(fd: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null || value === '') return;
  fd.append(key, String(value));
}

function boolFlag(value: unknown): string {
  return value ? '1' : '0';
}

/**
 * Builds the exact multipart/form-data body required by the backend
 * (see the official Postman collection, section "12. Admin - Catalog").
 * Flat string fields, bracketed arrays (`category_ids[]`, `variants[0][sku]`)
 * and real File objects for `images[]`.
 */
export function buildProductFormData(payload: Partial<Product>, images?: File[]): FormData {
  const fd = new FormData();
  const td = payload.toy_details;

  fd.append('name', localizedText(payload.name));
  appendIf(fd, 'sku', payload.sku);
  appendIf(fd, 'description', localizedText(payload.description));
  appendIf(fd, 'short_description', localizedText(payload.short_description));
  appendIf(fd, 'barcode', payload.barcode);
  appendIf(fd, 'brand_id', payload.brand_id);
  appendIf(fd, 'age_group_id', payload.age_group_id);

  const gender = td?.target_gender;
  if (gender && gender !== 'all') fd.append('gender', gender);

  const categoryIds =
    payload.category_ids && payload.category_ids.length
      ? payload.category_ids
      : payload.category_id !== undefined && payload.category_id !== null && payload.category_id !== ''
        ? [payload.category_id]
        : [];
  categoryIds.forEach((cid) => appendIf(fd, 'category_ids[]', cid));

  appendIf(fd, 'price', payload.price !== undefined ? payload.price : 0);
  appendIf(fd, 'sale_price', payload.discount_price);
  appendIf(fd, 'cost_price', payload.cost_price);
  appendIf(fd, 'status', payload.status);
  fd.append('is_featured', boolFlag(payload.is_featured));
  fd.append('is_new_arrival', boolFlag(payload.is_new_arrival));
  appendIf(fd, 'pieces_count', td?.piece_count);
  fd.append('educational', boolFlag(payload.educational));
  fd.append('battery_required', boolFlag(td?.requires_batteries));
  fd.append('choking_hazard', boolFlag(td?.choking_hazard));

  if (payload.has_variants && Array.isArray(payload.variants)) {
    payload.variants.forEach((v, i) => {
      appendIf(fd, `variants[${i}][sku]`, v.sku);
      fd.append(`variants[${i}][name]`, localizedText(v.name));
      appendIf(fd, `variants[${i}][stock]`, v.stock !== undefined ? v.stock : 0);
      appendIf(fd, `variants[${i}][price]`, v.price);
      appendIf(fd, `variants[${i}][sale_price]`, v.sale_price);
    });
  }

  const files =
    images && images.length
      ? images
      : (payload.images || [])
          .map((img) => img?.file)
          .filter((f): f is File => f instanceof File);
  files.forEach((f) => fd.append('images[]', f));

  return fd;
}

export const productService = {
  async getProducts(params?: TableQueryParams): Promise<ApiResponse<Product[]>> {
    const query = cleanQueryParams(params);
    try {
      const response = await apiClient.get<any>('/admin/products', { params: query });
      const res = response.data;
      const rows = Array.isArray(res) ? res : ensureArray(res?.data);
      const data = rows.map(normalizeProduct);
      const meta = res?.meta || { current_page: 1, last_page: 1, per_page: data.length, total: data.length };
      return { success: true, data, meta };
    } catch {
      // Mock search & filter
      let filtered = [...localProducts];
      if (query.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            localizedText(p.name, 'ar').toLowerCase().includes(q) ||
            localizedText(p.name, 'en').toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q)
        );
      }
      if (query.status) {
        filtered = filtered.filter((p) => p.status === query.status);
      }
      if (query.category_id) {
        filtered = filtered.filter((p) => String(p.category_id) === String(query.category_id));
      }

      const page = query.page || 1;
      const perPage = query.per_page || 10;
      const total = filtered.length;
      const paginated = filtered.slice((page - 1) * perPage, page * perPage);

      return {
        success: true,
        data: paginated,
        meta: {
          current_page: page,
          last_page: Math.ceil(total / perPage) || 1,
          per_page: perPage,
          total,
        },
      };
    }
  },

  async getProductById(id: number | string): Promise<ApiResponse<Product>> {
    // Use the /staff route: Admin\ProductController::show() does not exist
    // (returns 500). /staff/products/{id} returns { data: {...} } and works.
    const response = await apiClient.get<any>(`/staff/products/${id}`);
    const res = response.data;
    return { success: true, data: normalizeProduct(res.data || res) };
  },

  async createProduct(payload: Partial<Product>, images?: File[]): Promise<ApiResponse<Product>> {
    try {
      // POST /admin/products as multipart/form-data (flat fields + File images)
      const response = await apiClient.post<any>('/admin/products', buildProductFormData(payload, images));
      const res = response.data;
      return { success: true, message: 'تم إنشاء المنتج بنجاح', data: normalizeProduct(res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      const newProduct: Product = {
        id: Date.now(),
        name: payload.name || { ar: 'منتج جديد', en: 'New Toy Product' },
        slug: payload.slug || `toy-${Date.now()}`,
        description: payload.description || { ar: '', en: '' },
        sku: payload.sku || `TOY-${Math.floor(1000 + Math.random() * 9000)}`,
        status: payload.status || 'draft',
        price: Number(payload.price) || 0,
        discount_price: payload.discount_price ? Number(payload.discount_price) : undefined,
        cost_price: Number(payload.cost_price) || 0,
        tax_rate: payload.tax_rate || 14,
        stock: Number(payload.stock) || 0,
        low_stock_threshold: Number(payload.low_stock_threshold) || 5,
        category_id: payload.category_id,
        brand_id: payload.brand_id,
        age_group_id: payload.age_group_id,
        has_variants: !!payload.has_variants,
        variants: payload.variants || [],
        images: payload.images || [],
        toy_details: payload.toy_details || {
          requires_batteries: false,
          choking_hazard: false,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localProducts.unshift(newProduct);
      return { success: true, message: 'تم إنشاء المنتج بنجاح', data: newProduct };
    }
  },

  async updateProduct(id: number | string, payload: Partial<Product>, images?: File[]): Promise<ApiResponse<Product>> {
    try {
      // Backend requires POST (not PUT) + multipart/form-data for /admin/products/:id
      const response = await apiClient.post<any>(`/admin/products/${id}`, buildProductFormData(payload, images));
      const res = response.data;
      return { success: true, message: 'تم تحديث بيانات اللعبة بنجاح', data: normalizeProduct(res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      const idx = localProducts.findIndex((p) => String(p.id) === String(id));
      if (idx !== -1) {
        localProducts[idx] = { ...localProducts[idx], ...payload, updated_at: new Date().toISOString() };
        return { success: true, message: 'تم تحديث بيانات اللعبة بنجاح', data: localProducts[idx] };
      }
      throw new Error('Product not found');
    }
  },

  async deleteProduct(id: number | string): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.delete<any>(`/admin/products/${id}`);
      return { success: true, message: 'تم حذف المنتج بنجاح', data: null };
    } catch {
      localProducts = localProducts.filter((p) => String(p.id) !== String(id));
      return { success: true, message: 'تم حذف المنتج بنجاح', data: null };
    }
  },

  async bulkUpdateStatus(ids: (number | string)[], status: string): Promise<ApiResponse<null>> {
    // Endpoint not available in backend
    // const response = await apiClient.post<ApiResponse<null>>('/products/bulk-status', { ids, status });
    // return response.data;
    void ids;
    void status;
    return { success: false, message: 'قريباً', data: null };
  },

  async bulkDelete(ids: (number | string)[], force: boolean = false): Promise<ApiResponse<null>> {
    // Endpoint not available in backend
    // const response = await apiClient.post<ApiResponse<null>>('/products/bulk-delete', { ids, force });
    // return response.data;
    void ids;
    void force;
    return { success: false, message: 'قريباً', data: null };
  },
};

export default productService;
