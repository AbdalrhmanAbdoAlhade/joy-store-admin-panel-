import apiClient, { ApiResponse } from '@/src/lib/axios';
import { ShippingZone, ShippingMethod } from '@/src/types/shipping';

let mockZones: ShippingZone[] = [
  {
    id: 1,
    name: { ar: 'القاهرة والجيزة والإسكندرية', en: 'Greater Cairo & Alexandria' },
    governorates: ['القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية'],
    delivery_time_days: '1 - 2 أيام عمل',
    base_rate: 50,
    weight_step_kg: 5,
    additional_weight_rate: 10,
    free_shipping_threshold: 1000,
    is_active: true,
  },
  {
    id: 2,
    name: { ar: 'محافظات الدلتا والقناة', en: 'Delta & Canal Governorates' },
    governorates: ['المنوفية', 'الغربية', 'الدقهلية', 'الشرقية', 'الإسماعيلية', 'السويس', 'بورسعيد'],
    delivery_time_days: '2 - 3 أيام عمل',
    base_rate: 65,
    weight_step_kg: 5,
    additional_weight_rate: 15,
    free_shipping_threshold: 1200,
    is_active: true,
  },
  {
    id: 3,
    name: { ar: 'محافظات الصعيد والمناطق النائية', en: 'Upper Egypt & Remote Areas' },
    governorates: ['بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'مطروح', 'البحر الأحمر'],
    delivery_time_days: '3 - 5 أيام عمل',
    base_rate: 85,
    weight_step_kg: 5,
    additional_weight_rate: 20,
    free_shipping_threshold: 1500,
    is_active: true,
  },
];

let mockMethods: ShippingMethod[] = [
  {
    id: 1,
    name: { ar: 'شحن سريع لباب المنزل', en: 'Doorstep Standard Delivery' },
    code: 'standard',
    cost: 50,
    estimated_delivery_hours: 48,
    is_active: true,
  },
  {
    id: 2,
    name: { ar: 'شحن فائق السرعة في نفس اليوم (القاهرة الكبرى)', en: 'Same-Day Express Delivery' },
    code: 'same_day',
    cost: 100,
    estimated_delivery_hours: 8,
    is_active: true,
  },
  {
    id: 3,
    name: { ar: 'استلام مجاني من أقرب فرع متجر', en: 'Free In-Store Pickup' },
    code: 'branch_pickup',
    cost: 0,
    is_active: true,
  },
];

export const shippingService = {
  async getZones(): Promise<ApiResponse<ShippingZone[]>> {
    try {
      const response = await apiClient.get<ApiResponse<ShippingZone[]>>('/admin/shipping/zones');
      return response.data;
    } catch {
      return { success: true, data: mockZones };
    }
  },

  async createZone(payload: Partial<ShippingZone>): Promise<ApiResponse<ShippingZone>> {
    try {
      const response = await apiClient.post<ApiResponse<ShippingZone>>('/admin/shipping/zones', payload);
      return response.data;
    } catch {
      const newZone: ShippingZone = {
        id: Date.now(),
        name: payload.name || { ar: 'منطقة جديدة', en: 'New Zone' },
        governorates: payload.governorates || [],
        delivery_time_days: payload.delivery_time_days || '2 - 3 أيام',
        base_rate: Number(payload.base_rate) || 50,
        weight_step_kg: Number(payload.weight_step_kg) || 5,
        additional_weight_rate: Number(payload.additional_weight_rate) || 10,
        free_shipping_threshold: payload.free_shipping_threshold ? Number(payload.free_shipping_threshold) : undefined,
        is_active: payload.is_active ?? true,
      };
      mockZones.push(newZone);
      return { success: true, message: 'تم حفظ منطقة الشحن', data: newZone };
    }
  },

  async getMethods(): Promise<ApiResponse<ShippingMethod[]>> {
    try {
      const response = await apiClient.get<ApiResponse<ShippingMethod[]>>('/admin/shipping/methods');
      return response.data;
    } catch {
      return { success: true, data: mockMethods };
    }
  },
};

export default shippingService;
