import apiClient, { ApiResponse, BASE_API_URL } from '@/src/lib/axios';
import { Banner, StaticPage, FaqItem, ContactMessage } from '@/src/types/cms';
import { unwrapEnvelope, ensureArray, localizedText, toNumber } from '@/src/lib/api-helpers';

const MEDIA_BASE = BASE_API_URL.replace(/\/api\/v\d+\/?$/, '');

function appendIf(fd: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null || value === '') return;
  fd.append(key, String(value));
}

function resolveMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${MEDIA_BASE}/storage/${path.replace(/^\//, '')}`;
}

function normalizeBanner(b: any): Banner {
  return {
    id: b?.id ?? '',
    title: b?.title ?? '',
    subtitle: b?.subtitle ?? undefined,
    image_url: resolveMediaUrl(b?.image ?? b?.image_url),
    mobile_image_url: b?.mobile_image ? resolveMediaUrl(b.mobile_image) : undefined,
    link_url: b?.link ?? b?.link_url ?? undefined,
    placement: b?.position ?? b?.placement ?? 'home_slider',
    order: toNumber(b?.sort_order ?? b?.order),
    is_active: b?.is_active ?? true,
    start_at: b?.starts_at ?? b?.start_at ?? undefined,
    end_at: b?.ends_at ?? b?.end_at ?? undefined,
  };
}

function normalizePage(p: any): StaticPage {
  const title = p?.title;
  const content = p?.content;
  const metaTitle = p?.meta_title;
  const metaDesc = p?.meta_description;
  return {
    id: p?.id ?? '',
    title: typeof title === 'string' ? { ar: title, en: title } : title || { ar: '', en: '' },
    slug: p?.slug ?? '',
    content: typeof content === 'string' ? { ar: content, en: content } : content || { ar: '', en: '' },
    meta_title: typeof metaTitle === 'string' ? { ar: metaTitle, en: metaTitle } : metaTitle || undefined,
    meta_description: typeof metaDesc === 'string' ? { ar: metaDesc, en: metaDesc } : metaDesc || undefined,
    is_published: p?.is_active ?? p?.is_published ?? true,
    updated_at: p?.updated_at ?? p?.created_at ?? '',
  };
}

function normalizeFaq(f: any): FaqItem {
  const q = f?.question;
  const a = f?.answer;
  return {
    id: f?.id ?? '',
    question: typeof q === 'string' ? { ar: q, en: q } : q || { ar: '', en: '' },
    answer: typeof a === 'string' ? { ar: a, en: a } : a || { ar: '', en: '' },
    category: f?.category ?? 'general',
    order: toNumber(f?.sort_order ?? f?.order),
    is_active: f?.is_active ?? true,
  };
}

function buildBannerFormData(payload: Partial<Banner>, image?: File): FormData {
  const fd = new FormData();
  fd.append('title', localizedText(payload.title));
  appendIf(fd, 'position', payload.placement);
  appendIf(fd, 'link', payload.link_url);
  appendIf(fd, 'sort_order', payload.order);
  fd.append('is_active', payload.is_active === false ? '0' : '1');
  if (image) fd.append('image', image);
  return fd;
}

let mockBanners: Banner[] = [
  {
    id: 1,
    title: { ar: 'مهرجان الربيع لألعاب الذكاء وتنمية المهارات', en: 'Spring Brain & Stem Toys Festival' },
    subtitle: { ar: 'خصومات تصل إلى 35% على كل مجموعات الليجو والمكعبات', en: 'Up to 35% OFF on Lego & Building sets' },
    image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80',
    placement: 'home_hero',
    order: 1,
    is_active: true,
  },
];

let mockPages: StaticPage[] = [
  {
    id: 1,
    title: { ar: 'معايير سلامة الألعاب وسياسة الجودة', en: 'Toy Safety Standards & Quality Policy' },
    slug: 'toy-safety',
    content: {
      ar: 'جميع ألعابنا خالية من المواد السامة (BPA-Free) ومعتمدة بشهادات المطابقة الأوروبية EN71 والمصرية.',
      en: 'All toys are 100% non-toxic, BPA-Free, and certified with EN71 and ASTM safety standards.',
    },
    is_published: true,
    updated_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 2,
    title: { ar: 'سياسة الاستبدال والاسترجاع', en: 'Return & Exchange Policy' },
    slug: 'return-policy',
    content: {
      ar: 'يحق للعميل استرجاع الألعاب غير المفتوحة خلال 14 يوماً من تاريخ الاستلام.',
      en: 'Customers are eligible for a full refund on unopened toys within 14 days of delivery.',
    },
    is_published: true,
    updated_at: '2026-02-15T10:00:00Z',
  },
];

let mockFaqs: FaqItem[] = [
  {
    id: 1,
    question: { ar: 'كيف أختار اللعبة المناسبة لعمر طفلي؟', en: 'How do I pick the right toy for my child age?' },
    answer: { ar: 'يمكنك استخدام فلتر الفئات العمرية في المتجر لتصفح الألعاب الآمنة والمناسبة لكل مرحلة تطور.', en: 'Use the age-group filters to browse toys tailored to developmental milestones.' },
    category: 'selection',
    order: 1,
    is_active: true,
  },
];

let mockMessages: ContactMessage[] = [
  {
    id: 1,
    sender_name: 'منى الشريف',
    sender_email: 'mona.sherif@example.com',
    sender_phone: '01099887766',
    subject: 'استفسار عن توفير كميات جملة لحضانة أطفال',
    message: 'السلام عليكم، نرغب في شراء 50 لعبة مونتيسوري خشبية لحضانة في التجمع، هل يوجد خصم كميات؟',
    is_read: false,
    created_at: '2026-03-15T11:00:00Z',
  },
];

export const cmsService = {
  // Banners
  async getBanners(): Promise<ApiResponse<Banner[]>> {
    try {
      const response = await apiClient.get<any>('/admin/banners');
      const rows = ensureArray(unwrapEnvelope(response));
      return { success: true, data: rows.map(normalizeBanner) };
    } catch {
      return { success: true, data: mockBanners };
    }
  },

  async createBanner(payload: Partial<Banner>, image?: File): Promise<ApiResponse<Banner>> {
    try {
      const response = await apiClient.post<any>('/admin/banners', buildBannerFormData(payload, image));
      const res = response.data;
      return { success: true, message: 'تم حفظ البانر بنجاح', data: normalizeBanner(res.banner || res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      const newBanner: Banner = {
        id: Date.now(),
        title: payload.title || { ar: 'بانر جديد', en: 'New Banner' },
        image_url: payload.image_url || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80',
        placement: payload.placement || 'home_hero',
        order: mockBanners.length + 1,
        is_active: payload.is_active ?? true,
      };
      mockBanners.push(newBanner);
      return { success: true, message: 'تم حفظ البانر بنجاح', data: newBanner };
    }
  },

  async updateBanner(id: number | string, payload: Partial<Banner>, image?: File): Promise<ApiResponse<Banner>> {
    try {
      // Backend requires POST (not PUT) + multipart/form-data for /admin/banners/:id
      const response = await apiClient.post<any>(`/admin/banners/${id}`, buildBannerFormData(payload, image));
      const res = response.data;
      return { success: true, message: 'تم تحديث البانر بنجاح', data: normalizeBanner(res.banner || res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      mockBanners = mockBanners.map((b) => (String(b.id) === String(id) ? { ...b, ...payload } : b));
      return { success: true, message: 'تم تحديث البانر بنجاح', data: mockBanners.find((b) => String(b.id) === String(id))! };
    }
  },

  async deleteBanner(id: number | string): Promise<ApiResponse<null>> {
    try {
      await apiClient.delete<any>(`/admin/banners/${id}`);
      return { success: true, message: 'تم حذف البانر بنجاح', data: null };
    } catch (err: any) {
      if (err?.response) throw err;
      mockBanners = mockBanners.filter((b) => String(b.id) !== String(id));
      return { success: true, message: 'تم حذف البانر بنجاح', data: null };
    }
  },

  // Static Pages (JSON — plain array response)
  async getPages(): Promise<ApiResponse<StaticPage[]>> {
    try {
      const response = await apiClient.get<any>('/admin/cms/pages');
      const rows = ensureArray(unwrapEnvelope(response));
      return { success: true, data: rows.map(normalizePage) };
    } catch {
      return { success: true, data: mockPages };
    }
  },

  async createPage(payload: Partial<StaticPage>): Promise<ApiResponse<StaticPage>> {
    try {
      const response = await apiClient.post<any>('/admin/cms/pages', {
        title: localizedText(payload.title),
        slug: payload.slug || '',
        content: localizedText(payload.content),
        is_active: payload.is_published ?? true,
      });
      const res = response.data;
      return { success: true, message: 'تم إنشاء الصفحة', data: normalizePage(res.page || res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      const newPage: StaticPage = {
        id: Date.now(),
        title: (payload.title as any) || { ar: 'صفحة جديدة', en: 'New Page' },
        slug: payload.slug || `page-${Date.now()}`,
        content: (payload.content as any) || { ar: '', en: '' },
        is_published: payload.is_published ?? true,
        updated_at: new Date().toISOString(),
      };
      mockPages.push(newPage);
      return { success: true, message: 'تم إنشاء الصفحة', data: newPage };
    }
  },

  async updatePage(id: number | string, payload: Partial<StaticPage>): Promise<ApiResponse<StaticPage>> {
    try {
      const response = await apiClient.put<any>(`/admin/cms/pages/${id}`, {
        title: localizedText(payload.title),
        slug: payload.slug || '',
        content: localizedText(payload.content),
        is_active: payload.is_published ?? true,
      });
      const res = response.data;
      return { success: true, message: 'تم تحديث الصفحة', data: normalizePage(res.page || res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      mockPages = mockPages.map((p) => (String(p.id) === String(id) ? { ...p, ...payload } : p));
      return { success: true, message: 'تم تحديث الصفحة', data: mockPages.find((p) => String(p.id) === String(id))! };
    }
  },

  async deletePage(id: number | string): Promise<ApiResponse<null>> {
    try {
      await apiClient.delete<any>(`/admin/cms/pages/${id}`);
      return { success: true, message: 'تم حذف الصفحة', data: null };
    } catch (err: any) {
      if (err?.response) throw err;
      mockPages = mockPages.filter((p) => String(p.id) !== String(id));
      return { success: true, message: 'تم حذف الصفحة', data: null };
    }
  },

  // FAQs (JSON — plain array response)
  async getFaqs(): Promise<ApiResponse<FaqItem[]>> {
    try {
      const response = await apiClient.get<any>('/admin/cms/faqs');
      const rows = ensureArray(unwrapEnvelope(response));
      return { success: true, data: rows.map(normalizeFaq) };
    } catch {
      return { success: true, data: mockFaqs };
    }
  },

  async createFaq(payload: Partial<FaqItem> & { sort_order?: number }): Promise<ApiResponse<FaqItem>> {
    try {
      const response = await apiClient.post<any>('/admin/cms/faqs', {
        question: localizedText(payload.question),
        answer: localizedText(payload.answer),
        category: payload.category || 'general',
        sort_order: toNumber(payload.sort_order ?? payload.order),
        is_active: payload.is_active ?? true,
      });
      const res = response.data;
      return { success: true, message: 'تم إنشاء السؤال', data: normalizeFaq(res.faq || res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      const newFaq: FaqItem = {
        id: Date.now(),
        question: (payload.question as any) || { ar: 'سؤال جديد', en: 'New FAQ' },
        answer: (payload.answer as any) || { ar: '', en: '' },
        category: payload.category || 'general',
        order: toNumber(payload.sort_order ?? payload.order) || mockFaqs.length + 1,
        is_active: payload.is_active ?? true,
      };
      mockFaqs.push(newFaq);
      return { success: true, message: 'تم إنشاء السؤال', data: newFaq };
    }
  },

  async updateFaq(id: number | string, payload: Partial<FaqItem> & { sort_order?: number }): Promise<ApiResponse<FaqItem>> {
    try {
      const response = await apiClient.put<any>(`/admin/cms/faqs/${id}`, {
        question: localizedText(payload.question),
        answer: localizedText(payload.answer),
        category: payload.category || 'general',
        sort_order: toNumber(payload.sort_order ?? payload.order),
        is_active: payload.is_active ?? true,
      });
      const res = response.data;
      return { success: true, message: 'تم تحديث السؤال', data: normalizeFaq(res.faq || res.data || res) };
    } catch (err: any) {
      if (err?.response) throw err;
      mockFaqs = mockFaqs.map((f) => (String(f.id) === String(id) ? { ...f, ...payload } : f));
      return { success: true, message: 'تم تحديث السؤال', data: mockFaqs.find((f) => String(f.id) === String(id))! };
    }
  },

  async deleteFaq(id: number | string): Promise<ApiResponse<null>> {
    try {
      await apiClient.delete<any>(`/admin/cms/faqs/${id}`);
      return { success: true, message: 'تم حذف السؤال', data: null };
    } catch (err: any) {
      if (err?.response) throw err;
      mockFaqs = mockFaqs.filter((f) => String(f.id) !== String(id));
      return { success: true, message: 'تم حذف السؤال', data: null };
    }
  },

  // Contact Messages
  async getContactMessages(): Promise<ApiResponse<ContactMessage[]>> {
    // Endpoint not available in backend
    // const response = await apiClient.get<ApiResponse<ContactMessage[]>>('/cms/contact-messages');
    // return response.data;
    void mockMessages;
    return { success: true, message: 'قريباً', data: [] };
  },
};

export default cmsService;
