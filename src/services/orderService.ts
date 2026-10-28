import apiClient, { ApiResponse } from '@/src/lib/axios';
import { Order, OrderItem, OrderStatus, OrderTimelineEvent, ManualOrderPayload, RefundPayload } from '@/src/types/order';
import { TableQueryParams } from '@/src/types/api';
import { toNumber, ensureArray, cleanQueryParams } from '@/src/lib/api-helpers';

function normalizeOrderItem(it: any): OrderItem {
  return {
    id: it?.id ?? '',
    product_id: it?.product_id ?? it?.product?.id ?? '',
    variant_id: it?.variant_id,
    product_name: it?.product?.name ?? it?.product_name ?? it?.name ?? '',
    sku: it?.sku ?? '',
    image: it?.image ?? it?.product?.image ?? undefined,
    unit_price: toNumber(it?.unit_price ?? it?.price),
    cost_price: it?.cost_price != null ? toNumber(it?.cost_price) : undefined,
    quantity: toNumber(it?.quantity),
    total_price: toNumber(it?.total_price ?? it?.total),
  };
}

function normalizeTimelineEvent(e: any): OrderTimelineEvent {
  return {
    id: String(e?.id ?? ''),
    status: e?.status ?? 'pending',
    title: e?.title ?? e?.status ?? '',
    note: e?.note ?? undefined,
    created_at: e?.created_at ?? '',
    actor_name: e?.actor_name ?? e?.user?.name ?? 'النظام',
    actor_role: e?.actor_role ?? '',
  };
}

function normalizeOrder(o: any): Order {
  const customer = o?.customer || {};
  const addr = o?.shipping_address || {};
  const governorate = o?.governorate ?? addr?.governorate ?? '';
  const city = o?.city ?? addr?.city ?? '';
  const total = toNumber(o?.total);
  return {
    id: o?.id ?? '',
    order_number: o?.order_number ?? '',
    customer_id: customer?.id,
    customer_name: customer?.name ?? '',
    customer_email: customer?.email ?? '',
    customer_phone: customer?.phone ?? addr?.phone ?? '',
    status: o?.status ?? 'pending',
    payment_status: o?.payment_status ?? 'pending',
    payment_method: o?.payment_method ?? '',
    subtotal: toNumber(o?.subtotal),
    shipping_fee: toNumber(o?.shipping_amount ?? o?.shipping_fee),
    discount_amount: toNumber(o?.discount_amount),
    tax_amount: toNumber(o?.tax_amount),
    total_amount: total,
    total,
    items_count: toNumber(o?.items_count),
    coupon_code: o?.coupon?.code ?? o?.coupon_code ?? undefined,
    shipping_address: {
      recipient_name: customer?.name ?? '',
      phone: addr?.phone ?? customer?.phone ?? '',
      governorate,
      city,
      address_line: addr?.street ?? addr?.address_line ?? '',
      building_no: addr?.building_no,
      floor: addr?.floor,
      apartment: addr?.apartment,
    },
    governorate,
    city,
    shipping_method: o?.shipping_method ?? undefined,
    shipping_company: o?.shipping_company ?? undefined,
    tracking_number: o?.tracking_number ?? undefined,
    customer_notes: o?.customer_note ?? o?.customer_notes ?? undefined,
    admin_internal_notes: o?.admin_note ?? o?.admin_internal_notes ?? undefined,
    items: ensureArray(o?.items).map(normalizeOrderItem),
    payments: ensureArray(o?.payments),
    timeline: ensureArray(o?.status_history).map(normalizeTimelineEvent),
    created_at: o?.created_at ?? '',
    updated_at: o?.updated_at ?? '',
  };
}

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 1,
    order_number: 'ORD-7740',
    customer_id: 101,
    customer_name: 'أحمد محمود العوضي',
    customer_email: 'ahmed.awadi@example.com',
    customer_phone: '01012345678',
    status: 'processing',
    payment_status: 'paid',
    payment_method: 'credit_card',
    subtotal: 2049,
    shipping_fee: 50,
    discount_amount: 100,
    tax_amount: 280,
    total_amount: 2279,
    coupon_code: 'TOYJOY10',
    items: [
      {
        id: 1,
        product_id: 1,
        variant_id: 101,
        product_name: { ar: 'مجموعة ليجو قلعة المغامرات الإبداعية', en: 'Lego Creative Adventure Castle' },
        sku: 'TOY-LEGO-001-STD',
        unit_price: 1599,
        cost_price: 1100,
        quantity: 1,
        total_price: 1599,
      },
      {
        id: 2,
        product_id: 2,
        product_name: { ar: 'دمية دب محشو قطيفة فائق النعومة 60 سم', en: 'Ultra Soft Plush Teddy Bear 60cm' },
        sku: 'TOY-BEAR-002',
        unit_price: 450,
        cost_price: 260,
        quantity: 1,
        total_price: 450,
      },
    ],
    shipping_address: {
      recipient_name: 'أحمد محمود العوضي',
      phone: '01012345678',
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      address_line: 'شارع عباس العقاد، برج النصر، شقة 402',
      building_no: '22',
      floor: '4',
      apartment: '402',
    },
    shipping_company: 'Bosta Express',
    tracking_number: 'BST-908234-EG',
    timeline: [
      { id: '1', status: 'pending', title: 'تم استلام الطلب', note: 'الدفع الإلكتروني تم بنجاح', created_at: '2026-03-15T09:30:00Z', actor_name: 'النظام', actor_role: 'system' },
      { id: '2', status: 'processing', title: 'جاري تجهيز وتغليف الألعاب', note: 'تم إرسال إشعار للمستودع', created_at: '2026-03-15T11:00:00Z', actor_name: 'عبدالرحمن محمد', actor_role: 'admin' },
    ],
    admin_internal_notes: 'العميل طلب تغليف هدية شريط أحمر بمناسبة عيد ميلاد طفله (5 سنوات).',
    created_at: '2026-03-15T09:30:00Z',
    updated_at: '2026-03-15T11:00:00Z',
  },
  {
    id: 2,
    order_number: 'ORD-7741',
    customer_id: 102,
    customer_name: 'سارة إبراهيم الشناوي',
    customer_email: 'sara.shennawy@example.com',
    customer_phone: '01198765432',
    status: 'shipped',
    payment_status: 'paid',
    payment_method: 'vodafone_cash',
    subtotal: 990,
    shipping_fee: 60,
    discount_amount: 0,
    tax_amount: 138,
    total_amount: 1188,
    items: [
      {
        id: 3,
        product_id: 3,
        variant_id: 103,
        product_name: { ar: 'سيارة دفع رباعي تحكم عن بعد 4WD', en: 'RC 4WD Monster Truck' },
        sku: 'TOY-RC-003-RED',
        unit_price: 990,
        cost_price: 650,
        quantity: 1,
        total_price: 990,
      },
    ],
    shipping_address: {
      recipient_name: 'سارة إبراهيم الشناوي',
      phone: '01198765432',
      governorate: 'الجيزة',
      city: 'الشيخ زايد',
      address_line: 'حي الندى، فيلا 14',
    },
    shipping_company: 'Mylerz',
    tracking_number: 'MYL-6612098',
    timeline: [
      { id: '3', status: 'pending', title: 'تم إنشاء الطلب', created_at: '2026-03-14T14:00:00Z', actor_name: 'العميل', actor_role: 'customer' },
      { id: '4', status: 'processing', title: 'تم التجهيز', created_at: '2026-03-14T16:00:00Z', actor_name: 'محمد علي', actor_role: 'employee' },
      { id: '5', status: 'shipped', title: 'تم تسليم الشحنة لمندوب التوصيل', note: 'المندوب كابتن طارق', created_at: '2026-03-15T08:00:00Z', actor_name: 'شركة الشحن', actor_role: 'courier' },
    ],
    created_at: '2026-03-14T14:00:00Z',
    updated_at: '2026-03-15T08:00:00Z',
  },
  {
    id: 3,
    order_number: 'ORD-7742',
    customer_id: 103,
    customer_name: 'محمود عبدالفتاح',
    customer_email: 'mahmoud.fatah@example.com',
    customer_phone: '01223344556',
    status: 'delivered',
    payment_status: 'paid',
    payment_method: 'cod',
    subtotal: 1850,
    shipping_fee: 70,
    discount_amount: 0,
    tax_amount: 259,
    total_amount: 2179,
    items: [
      {
        id: 4,
        product_id: 1,
        variant_id: 101,
        product_name: { ar: 'مجموعة ليجو قلعة المغامرات الإبداعية', en: 'Lego Creative Adventure Castle' },
        sku: 'TOY-LEGO-001-STD',
        unit_price: 1850,
        cost_price: 1100,
        quantity: 1,
        total_price: 1850,
      },
    ],
    shipping_address: {
      recipient_name: 'محمود عبدالفتاح',
      phone: '01223344556',
      governorate: 'الإسكندرية',
      city: 'سموحة',
      address_line: 'شارع فوزي معاذ، عمارة الأطباء',
    },
    shipping_company: 'Bosta Express',
    tracking_number: 'BST-552190-ALX',
    timeline: [
      { id: '6', status: 'delivered', title: 'تم التسليم واستلام المبلغ نقدًا عند الاستلام', created_at: '2026-03-13T17:00:00Z', actor_name: 'مندوب الشحن', actor_role: 'courier' },
    ],
    created_at: '2026-03-11T10:00:00Z',
    updated_at: '2026-03-13T17:00:00Z',
  },
];

let localOrders = [...INITIAL_MOCK_ORDERS];

export const orderService = {
  async getOrders(params?: TableQueryParams): Promise<ApiResponse<Order[]>> {
    const query = cleanQueryParams(params);
    try {
      const response = await apiClient.get<any>('/staff/orders', { params: query });
      const res = response.data;
      const rows = Array.isArray(res) ? res : ensureArray(res?.data);
      const data = rows.map(normalizeOrder);
      const meta = res?.meta || { current_page: 1, last_page: 1, per_page: data.length, total: data.length };
      return { success: true, data, meta };
    } catch {
      let filtered = [...localOrders];
      if (query.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.order_number.toLowerCase().includes(q) ||
            o.customer_name.toLowerCase().includes(q) ||
            o.customer_phone.includes(q)
        );
      }
      if (query.status) {
        filtered = filtered.filter((o) => o.status === query.status);
      }
      if (query.governorate) {
        filtered = filtered.filter((o) => o.shipping_address.governorate === query.governorate);
      }
      return {
        success: true,
        data: filtered,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: filtered.length,
        },
      };
    }
  },

  async getOrderById(id: number | string): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.get<any>(`/staff/orders/${id}`);
      const res = response.data;
      return { success: true, data: normalizeOrder(res.data || res) };
    } catch {
      const found = localOrders.find((o) => String(o.id) === String(id) || o.order_number === String(id));
      if (!found) throw new Error('Order not found');
      return { success: true, data: found };
    }
  },

  async updateOrderStatus(id: number | string, status: OrderStatus, note?: string): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.patch<any>(`/staff/orders/${id}/status`, { status, note });
      const res = response.data;
      return { success: true, message: 'تم تحديث حالة الطلب بنجاح', data: res.data || res };
    } catch {
      const idx = localOrders.findIndex((o) => String(o.id) === String(id));
      if (idx !== -1) {
        const updated = { ...localOrders[idx] };
        updated.status = status;
        updated.timeline = [
          ...updated.timeline,
          {
            id: String(Date.now()),
            status,
            title: `تم تغيير الحالة إلى ${status}`,
            note: note || '',
            created_at: new Date().toISOString(),
            actor_name: 'أدمن المتجر',
            actor_role: 'admin',
          },
        ];
        localOrders[idx] = updated;
        return { success: true, message: 'تم تحديث حالة الطلب بنجاح', data: updated };
      }
      throw new Error('Order not found');
    }
  },

  async setTrackingNumber(id: number | string, tracking_number: string, shipping_company?: string): Promise<ApiResponse<Order>> {
    // Endpoint not available in backend
    // const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/tracking`, { tracking_number, shipping_company });
    // return response.data;
    void id;
    void tracking_number;
    void shipping_company;
    return { success: false, message: 'قريباً', data: null as any };
  },

  async addInternalNote(id: number | string, note: string): Promise<ApiResponse<Order>> {
    // Endpoint not available in backend
    // const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/notes`, { note });
    // return response.data;
    void id;
    void note;
    return { success: false, message: 'قريباً', data: null as any };
  },

  async createManualOrder(payload: ManualOrderPayload): Promise<ApiResponse<Order>> {
    // Endpoint not available in backend
    // const response = await apiClient.post<ApiResponse<Order>>('/orders/manual', payload);
    // return response.data;
    void payload;
    return { success: false, message: 'قريباً', data: null as any };
  },

  async processRefund(payload: RefundPayload): Promise<ApiResponse<null>> {
    // Endpoint not available in backend
    // const response = await apiClient.post<ApiResponse<null>>(`/orders/${payload.order_id}/refund`, payload);
    // return response.data;
    void payload;
    return { success: false, message: 'قريباً', data: null };
  },
};

export default orderService;
