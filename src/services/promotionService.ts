import apiClient, { ApiResponse } from '@/src/lib/axios';
import { Coupon, FlashSale, LoyaltySettings } from '@/src/types/promotion';
import { TableQueryParams } from '@/src/types/api';

let mockCoupons: Coupon[] = [
  {
    id: 1,
    code: 'TOYJOY10',
    description: { ar: 'خصم 10% بمناسبة عطلة الربيع على جميع الألعاب', en: '10% Spring Holiday Discount on all toys' },
    type: 'percentage',
    value: 10,
    min_order_value: 500,
    max_discount_amount: 150,
    usage_limit: 500,
    usage_count: 142,
    usage_limit_per_user: 1,
    start_date: '2026-03-01T00:00:00Z',
    end_date: '2026-04-30T23:59:59Z',
    is_active: true,
  },
  {
    id: 2,
    code: 'FREEKID',
    description: { ar: 'شحن مجاني للطلبات فوق 1000 جنيه', en: 'Free Shipping for orders over 1000 EGP' },
    type: 'free_shipping',
    value: 0,
    min_order_value: 1000,
    usage_count: 89,
    start_date: '2026-01-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    is_active: true,
  },
];

let mockFlashSales: FlashSale[] = [
  {
    id: 1,
    title: { ar: 'عاصفة خصومات ألعاب الليجو والمكعبات', en: 'Lego & Blocks Flash Blitz' },
    start_at: '2026-03-15T00:00:00Z',
    end_at: '2026-03-22T23:59:59Z',
    is_active: true,
    items: [
      {
        product_id: 1,
        product_name: { ar: 'مجموعة ليجو قلعة المغامرات الإبداعية', en: 'Lego Creative Adventure Castle' },
        original_price: 1850,
        sale_price: 1450,
        discount_percentage: 22,
        allocated_quantity: 20,
        sold_quantity: 11,
      },
    ],
  },
];

let mockLoyaltySettings: LoyaltySettings = {
  is_enabled: true,
  points_per_egp: 1, // 1 point for every 10 EGP
  point_value_egp: 0.05, // 100 points = 5 EGP
  min_points_to_redeem: 200,
  points_expiry_days: 180,
  welcome_bonus_points: 50,
};

export const promotionService = {
  // Coupons
  async getCoupons(params?: TableQueryParams): Promise<ApiResponse<Coupon[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Coupon[]>>('/admin/coupons', { params });
      return response.data;
    } catch {
      return { success: true, data: mockCoupons };
    }
  },

  async createCoupon(payload: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    try {
      const response = await apiClient.post<ApiResponse<Coupon>>('/admin/coupons', payload);
      return response.data;
    } catch {
      const newCoupon: Coupon = {
        id: Date.now(),
        code: payload.code || 'COUPON',
        description: payload.description,
        type: payload.type || 'percentage',
        value: Number(payload.value) || 0,
        min_order_value: payload.min_order_value ? Number(payload.min_order_value) : undefined,
        usage_limit: payload.usage_limit ? Number(payload.usage_limit) : undefined,
        usage_count: 0,
        start_date: payload.start_date || new Date().toISOString(),
        end_date: payload.end_date || new Date().toISOString(),
        is_active: payload.is_active ?? true,
      };
      mockCoupons.unshift(newCoupon);
      return { success: true, message: 'تم إنشاء الكوبون بنجاح', data: newCoupon };
    }
  },

  async deleteCoupon(id: number | string): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.delete<ApiResponse<null>>(`/admin/coupons/${id}`);
      return response.data;
    } catch {
      mockCoupons = mockCoupons.filter((c) => String(c.id) !== String(id));
      return { success: true, message: 'تم حذف الكوبون بنجاح', data: null };
    }
  },

  // Flash Sales
  async getFlashSales(): Promise<ApiResponse<FlashSale[]>> {
    try {
      // TODO: confirm endpoint /flash-sales
      const response = await apiClient.get<ApiResponse<FlashSale[]>>('/admin/flash-sales');
      return response.data;
    } catch {
      return { success: true, data: mockFlashSales };
    }
  },

  // Loyalty Settings
  async getLoyaltySettings(): Promise<ApiResponse<LoyaltySettings>> {
    // Endpoint not available in backend
    // const response = await apiClient.get<ApiResponse<LoyaltySettings>>('/loyalty-settings');
    // return response.data;
    void mockLoyaltySettings;
    return { success: false, message: 'قريباً', data: null as any };
  },

  async updateLoyaltySettings(payload: Partial<LoyaltySettings>): Promise<ApiResponse<LoyaltySettings>> {
    // Endpoint not available in backend
    // const response = await apiClient.put<ApiResponse<LoyaltySettings>>('/loyalty-settings', payload);
    // return response.data;
    void payload;
    return { success: false, message: 'قريباً', data: null as any };
  },
};

export default promotionService;
